// Responsabilidade: Importação e exportação de projetos e notas individuais

const { nextTick } = Vue;

import { files, folders, activeFile, persist, getFolderName, importConflict } from '../state.js';
import { uuid, refreshIcons } from '../utils.js';
import { showToast } from '../components/toast.js';

export function exportProject() {
  const data = {
    exportedAt: new Date().toISOString(),
    files: files.value.map(f => ({
      id: f.id, name: f.name, folder: getFolderName(f.folder),
      content: f.content, updatedAt: f.updatedAt
    }))
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'mdviewer-export.json'; a.click();
  URL.revokeObjectURL(url);
  showToast('Projeto exportado');
}

export function exportSingle() {
  if (!activeFile.value) return;
  const blob = new Blob([activeFile.value.content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = (activeFile.value.name || 'nota') + '.md'; a.click();
  URL.revokeObjectURL(url);
  showToast('Nota exportada');
}

export function importProject() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.files || !Array.isArray(data.files)) { showToast('Formato invalido'); return; }
        processImport(data);
      } catch { showToast('Erro ao ler arquivo'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

function resolveFolderId(folderName) {
  if (!folderName) return null;
  const f = folders.value.find(x => x.name === folderName);
  return f ? f.id : null;
}

function processImport(data) {
  const conflicts = [];
  const newFiles = [];
  data.files.forEach(imported => {
    const existing = files.value.find(f => f.id === imported.id);
    if (existing) {
      conflicts.push(imported);
    } else {
      newFiles.push(imported);
    }
  });

  data.files.forEach(imported => {
    if (imported.folder && typeof imported.folder === 'string') {
      const existing = folders.value.find(f => f.name === imported.folder);
      if (!existing) {
        folders.value.push({ id: uuid(), name: imported.folder });
      }
    }
  });

  newFiles.forEach(imported => {
    const folderId = resolveFolderId(imported.folder);
    files.value.push({
      id: imported.id, name: imported.name, content: imported.content,
      folder: folderId, createdAt: imported.updatedAt || new Date().toISOString(),
      updatedAt: imported.updatedAt || new Date().toISOString()
    });
  });

  if (conflicts.length) {
    importConflict.value = { visible: true, conflicts, pendingData: data };
  } else {
    persist();
    showToast('Importado com sucesso');
    nextTick(refreshIcons);
  }
}

export function resolveImport(action) {
  const conflicts = importConflict.value.conflicts;
  if (action === 'replace') {
    conflicts.forEach(imported => {
      const idx = files.value.findIndex(f => f.id === imported.id);
      const folderId = resolveFolderId(imported.folder);
      if (idx >= 0) {
        files.value[idx] = {
          id: imported.id, name: imported.name, content: imported.content,
          folder: folderId, createdAt: imported.updatedAt || new Date().toISOString(),
          updatedAt: imported.updatedAt || new Date().toISOString()
        };
      }
    });
  } else if (action === 'keep') {
    conflicts.forEach(imported => {
      const folderId = resolveFolderId(imported.folder);
      files.value.push({
        id: uuid(), name: imported.name + ' (importado)', content: imported.content,
        folder: folderId, createdAt: new Date().toISOString(),
        updatedAt: imported.updatedAt || new Date().toISOString()
      });
    });
  }
  importConflict.value.visible = false;
  persist();
  showToast('Importado com sucesso');
  nextTick(refreshIcons);
}
