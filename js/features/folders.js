// Responsabilidade: Gerenciamento de pastas (diretórios GitHub)

const { nextTick } = Vue;

import { folders, files, activeFolderId, sidebarOpen, notesListCollapsed, collapsedSections } from '../state.js';
import { saveCollapsed } from '../storage.js';
import { createFileOnGitHub } from './github.js';
import { refreshIcons } from '../utils.js';
import { showToast } from '../components/toast.js';
import { showPrompt } from '../components/dialog.js';

export async function createFolder() {
  const name = await showPrompt({ title: 'Nova pasta', placeholder: 'Nome da pasta', confirmText: 'Criar' });
  if (!name || !name.trim()) return;
  const safeName = name.trim().replace(/[^a-zA-Z0-9\u00C0-\u00FA _-]/g, '').replace(/\s+/g, '-');
  if (!safeName) return;
  try {
    await createFileOnGitHub(safeName + '/.gitkeep', '');
    if (!folders.value.find(f => f.id === safeName)) {
      folders.value.push({ id: safeName, name: safeName });
    }
    activeFolderId.value = safeName;
    showToast('Pasta criada');
    nextTick(refreshIcons);
  } catch { /* error handled in github.js */ }
}

export function selectFolder(id) {
  activeFolderId.value = id;
  notesListCollapsed.value = false;
  sidebarOpen.value = false;
}

export function filesByFolder(folderId) {
  return files.value.filter(f => f.folder === folderId);
}

export function toggleSection(key) {
  collapsedSections.value = { ...collapsedSections.value, [key]: !collapsedSections.value[key] };
  saveCollapsed(collapsedSections.value);
}
