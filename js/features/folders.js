// Responsabilidade: Gerenciamento de pastas (CRUD, rename, delete)

const { nextTick } = Vue;

import { folders, files, activeFolderId, sidebarOpen, renamingFolderId, renamingFolderName, persist, collapsedSections } from '../state.js';
import { uuid, refreshIcons } from '../utils.js';
import { saveCollapsed } from '../storage.js';

export function createFolder() {
  folders.value.push({ id: uuid(), name: 'Nova pasta' });
  persist();
  nextTick(refreshIcons);
}

export function selectFolder(id) {
  activeFolderId.value = id;
  sidebarOpen.value = false;
}

export function startRenameFolder(f) {
  renamingFolderId.value = f.id;
  renamingFolderName.value = f.name;
  nextTick(() => {
    const el = document.querySelector('.rename-input');
    if (el) { el.focus(); el.select(); }
  });
}

export function confirmRenameFolder() {
  if (renamingFolderId.value && renamingFolderName.value.trim()) {
    const f = folders.value.find(x => x.id === renamingFolderId.value);
    if (f) f.name = renamingFolderName.value.trim();
    persist();
  }
  renamingFolderId.value = null;
}

export function cancelRenameFolder() {
  renamingFolderId.value = null;
}

export function deleteFolder(id) {
  files.value.forEach(f => { if (f.folder === id) f.folder = null; });
  folders.value = folders.value.filter(f => f.id !== id);
  if (activeFolderId.value === id) activeFolderId.value = null;
  persist();
}

export function filesByFolder(folderId) {
  return files.value.filter(f => f.folder === folderId);
}

export function toggleSection(key) {
  collapsedSections.value = { ...collapsedSections.value, [key]: !collapsedSections.value[key] };
  saveCollapsed(collapsedSections.value);
}
