// Responsabilidade: Gerenciamento de notas — criar, abrir, excluir, salvar, renomear (via GitHub)

const { nextTick } = Vue;

import { files, activeFolderId, activeFileId, activeFile, editMode, hasUnsavedChanges, renameNote, bookmarksData, fillableFields } from '../state.js';
import { saveBookmarks, saveFillable } from '../storage.js';
import { fetchFileContent, saveFile, createFileOnGitHub, deleteFileOnGitHub, renameFileOnGitHub } from './github.js';
import { refreshIcons } from '../utils.js';
import { showToast } from '../components/toast.js';
import { showConfirm } from '../components/dialog.js';

export async function createFile() {
  const folder = activeFolderId.value || '';
  const timestamp = Date.now().toString(36);
  const name = 'nova-nota-' + timestamp + '.md';
  const path = folder ? folder + '/' + name : name;
  const content = '# Nova nota\n\n';
  try {
    const result = await createFileOnGitHub(path, content);
    files.value.push({
      path: result.path, name: result.name, sha: result.sha,
      folder: folder, content: content
    });
    activeFileId.value = result.path;
    editMode.value = true;
    hasUnsavedChanges.value = false;
    showToast('Nota criada');
    nextTick(refreshIcons);
  } catch { /* error handled in github.js */ }
}

export async function openFile(path) {
  if (hasUnsavedChanges.value && activeFile.value) {
    await saveActiveFile();
  }
  activeFileId.value = path;
  editMode.value = false;
  const file = files.value.find(f => f.path === path);
  if (file && file.content === undefined) {
    await fetchFileContent(file);
  }
  nextTick(refreshIcons);
}

export async function deleteFile(path) {
  const file = files.value.find(f => f.path === path);
  if (!file) return;
  const confirmed = await showConfirm({ title: 'Excluir nota', message: 'Excluir "' + file.name + '" do repositório?', confirmText: 'Excluir', danger: true });
  if (!confirmed) return;
  try {
    await deleteFileOnGitHub(file.path, file.sha);
    files.value = files.value.filter(f => f.path !== path);
    if (activeFileId.value === path) activeFileId.value = null;
    bookmarksData.value = bookmarksData.value.filter(b => b.filePath !== path);
    saveBookmarks(bookmarksData.value);
    fillableFields.value = fillableFields.value.filter(f => f.filePath !== path);
    saveFillable(fillableFields.value);
    hasUnsavedChanges.value = false;
    showToast('Nota exclu\u00edda');
    nextTick(refreshIcons);
  } catch { /* error handled */ }
}

export function onContentChange() {
  if (activeFile.value) {
    hasUnsavedChanges.value = true;
  }
}

export async function saveActiveFile() {
  const file = activeFile.value;
  if (!file || !hasUnsavedChanges.value) return;
  await saveFile(file);
}

export function startRenameNote() {
  if (!activeFile.value) return;
  const displayName = activeFile.value.name.replace(/\.md$/, '');
  renameNote.value = { visible: true, name: displayName, filePath: activeFile.value.path };
}

export async function confirmRenameNote() {
  const newName = renameNote.value.name.trim();
  if (!newName) { renameNote.value.visible = false; return; }
  const file = files.value.find(f => f.path === renameNote.value.filePath);
  if (!file) { renameNote.value.visible = false; return; }
  const newFileName = newName.endsWith('.md') ? newName : newName + '.md';
  const newPath = file.folder ? file.folder + '/' + newFileName : newFileName;
  if (newPath === file.path) { renameNote.value.visible = false; return; }
  try {
    if (file.content === undefined) await fetchFileContent(file);
    const result = await renameFileOnGitHub(file.path, file.sha, newPath, file.content);
    const oldPath = file.path;
    file.path = result.path;
    file.name = result.name;
    file.sha = result.sha;
    if (activeFileId.value === oldPath) activeFileId.value = result.path;
    bookmarksData.value.forEach(b => { if (b.filePath === oldPath) b.filePath = result.path; });
    saveBookmarks(bookmarksData.value);
    fillableFields.value.forEach(f => { if (f.filePath === oldPath) f.filePath = result.path; });
    saveFillable(fillableFields.value);
    showToast('Nota renomeada');
  } catch { /* error handled */ }
  renameNote.value.visible = false;
  nextTick(refreshIcons);
}

export async function handleTitleChange(event) {
  const newName = event.target.value.trim();
  if (!newName || !activeFile.value) return;
  const file = activeFile.value;
  const currentName = file.name.replace(/\.md$/, '');
  if (newName === currentName) return;
  const newFileName = newName.endsWith('.md') ? newName : newName + '.md';
  const newPath = file.folder ? file.folder + '/' + newFileName : newFileName;
  if (newPath === file.path) return;
  try {
    if (file.content === undefined) await fetchFileContent(file);
    const result = await renameFileOnGitHub(file.path, file.sha, newPath, file.content);
    const oldPath = file.path;
    file.path = result.path;
    file.name = result.name;
    file.sha = result.sha;
    if (activeFileId.value === oldPath) activeFileId.value = result.path;
    bookmarksData.value.forEach(b => { if (b.filePath === oldPath) b.filePath = result.path; });
    saveBookmarks(bookmarksData.value);
    fillableFields.value.forEach(f => { if (f.filePath === oldPath) f.filePath = result.path; });
    saveFillable(fillableFields.value);
    showToast('Nota renomeada');
  } catch { /* error handled */ }
  nextTick(refreshIcons);
}
