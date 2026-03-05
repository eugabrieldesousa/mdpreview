// Responsabilidade: Estado reativo centralizado — única fonte de verdade da aplicação

const { ref, computed } = Vue;

import { loadFiles, loadFolders, loadSettings, loadFillable, loadBookmarks, saveFiles, saveFolders } from './storage.js';
import { uuid } from './utils.js';

// --- Dados persistidos ---
const settings = loadSettings();

export const files = ref(loadFiles());
export const folders = ref(loadFolders([{ id: uuid(), name: 'Notas' }]));
export const isDark = ref(settings.dark);
export const fontSize = ref(settings.fontSize);
export const fontFamily = ref(settings.fontFamily);

// --- Estado de navegação ---
export const activeFolderId = ref(null);
export const activeFileId = ref(null);
export const editMode = ref(false);
export const searchQuery = ref('');
export const sidebarOpen = ref(false);
export const showSettings = ref(false);

// --- Referência de template ---
export const markdownBody = ref(null);

// --- Renomeação de pasta ---
export const renamingFolderId = ref(null);
export const renamingFolderName = ref('');

// --- Toast ---
export const toast = ref({ visible: false, message: '', fading: false });

// --- Popover ---
export const popover = ref({ visible: false, x: 0, y: 0, text: '', inCodeBlock: false });
export const selectedText = ref('');

// --- Import conflict ---
export const importConflict = ref({ visible: false, conflicts: [], pendingData: null });

// --- Rename note ---
export const renameNote = ref({ visible: false, name: '', fileId: '' });

// --- Fillable fields ---
export const fillableFields = ref(loadFillable());
export const fillModal = ref({ visible: false, fields: [], blockHash: '', blockRaw: '' });

// --- Bookmarks ---
export const bookmarksData = ref(loadBookmarks());
export const showBookmarks = ref(false);

// --- Responsividade ---
export const isMobile = ref(window.innerWidth <= 768);

export function onResize() {
  isMobile.value = window.innerWidth <= 768;
}

// --- Computed ---
export const activeFile = computed(() =>
  files.value.find(f => f.id === activeFileId.value) || null
);

export const currentFolderName = computed(() => {
  if (activeFolderId.value === null) return 'Todas as notas';
  const f = folders.value.find(x => x.id === activeFolderId.value);
  return f ? f.name : 'Todas as notas';
});

export const filteredFiles = computed(() => {
  let list = activeFolderId.value === null
    ? files.value
    : files.value.filter(f => f.folder === activeFolderId.value);
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(f => f.name.toLowerCase().includes(q) || f.content.toLowerCase().includes(q));
  }
  return list.slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
});

// --- Helpers que dependem do estado ---
export function getFolderName(folderId) {
  if (!folderId) return 'Sem pasta';
  const f = folders.value.find(x => x.id === folderId);
  return f ? f.name : 'Sem pasta';
}

export function persist() {
  saveFiles(files.value);
  saveFolders(folders.value);
}
