// Responsabilidade: Gerenciamento de notas (criar, abrir, excluir, editar, renomear)

const { nextTick } = Vue;

import { files, folders, activeFolderId, activeFileId, activeFile, editMode, persist, renameNote, bookmarksData, fillableFields } from '../state.js';
import { saveBookmarks, saveFillable } from '../storage.js';
import { uuid, refreshIcons } from '../utils.js';

export function createFile() {
  const id = uuid();
  const folderId = activeFolderId.value || (folders.value.length ? folders.value[0].id : null);
  files.value.push({
    id, name: 'Nova nota', content: '# Nova nota\n\n',
    folder: folderId, createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  activeFileId.value = id;
  editMode.value = true;
  persist();
  nextTick(refreshIcons);
}

export function openFile(id) {
  activeFileId.value = id;
  editMode.value = false;
  nextTick(refreshIcons);
}

export function deleteFile(id) {
  files.value = files.value.filter(f => f.id !== id);
  if (activeFileId.value === id) activeFileId.value = null;
  bookmarksData.value = bookmarksData.value.filter(b => b.fileId !== id);
  saveBookmarks(bookmarksData.value);
  fillableFields.value = fillableFields.value.filter(f => f.fileId !== id);
  saveFillable(fillableFields.value);
  persist();
  nextTick(refreshIcons);
}

export function onContentChange() {
  if (activeFile.value) {
    activeFile.value.updatedAt = new Date().toISOString();
    const m = activeFile.value.content.match(/^#\s+(.+)/m);
    if (m) activeFile.value.name = m[1].trim();
    persist();
  }
}

export function startRenameNote() {
  if (!activeFile.value) return;
  renameNote.value = { visible: true, name: activeFile.value.name, fileId: activeFile.value.id };
}

export function confirmRenameNote() {
  const f = files.value.find(x => x.id === renameNote.value.fileId);
  if (f && renameNote.value.name.trim()) {
    f.name = renameNote.value.name.trim();
    persist();
  }
  renameNote.value.visible = false;
}
