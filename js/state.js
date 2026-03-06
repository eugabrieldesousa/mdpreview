// Responsabilidade: Estado reativo centralizado — única fonte de verdade da aplicação

const { ref, computed } = Vue;

import { loadSettings, loadFillable, loadBookmarks, loadCollapsed, loadGhToken, loadGhOwner, loadGhRepo } from './storage.js';

// --- Configurações persistidas ---
const settings = loadSettings();

export const isDark = ref(settings.dark);
export const fontSize = ref(settings.fontSize);
export const fontFamily = ref(settings.fontFamily);

// --- GitHub Auth ---
export const ghToken = ref(loadGhToken());
export const ghOwner = ref(loadGhOwner());
export const ghRepo = ref(loadGhRepo());
export const ghConnected = ref(false);
export const ghScreen = ref('login'); // 'login' | 'repos' | 'app'
export const ghRepos = ref([]);
export const ghLoading = ref(false);
export const ghSaving = ref(false);
export const ghError = ref('');

// --- Dados (via GitHub) ---
export const files = ref([]);     // [{ path, name, sha, folder, content }]
export const folders = ref([]);   // [{ id, name }]

// --- Estado de navegação ---
export const activeFolderId = ref(null);
export const activeFileId = ref(null); // file path
export const editMode = ref(false);
export const searchQuery = ref('');
export const sidebarOpen = ref(false);
export const showSettings = ref(false);
export const hasUnsavedChanges = ref(false);

// --- Referência de template ---
export const markdownBody = ref(null);

// --- Toast ---
export const toast = ref({ visible: false, message: '', fading: false });

// --- Popover ---
export const popover = ref({ visible: false, x: 0, y: 0, text: '', inCodeBlock: false });
export const selectedText = ref('');

// --- Rename note ---
export const renameNote = ref({ visible: false, name: '', filePath: '' });

// --- Fillable fields ---
export const fillableFields = ref(loadFillable());
export const fillModal = ref({ visible: false, fields: [], blockHash: '', blockRaw: '' });

// --- Bookmarks ---
export const bookmarksData = ref(loadBookmarks());
export const showBookmarks = ref(false);

// --- Collapsible Sections ---
export const collapsedSections = ref(loadCollapsed());

// --- Column Collapse (desktop) ---
export const sidebarCollapsed = ref(false);
export const notesListCollapsed = ref(false);

// --- Responsividade ---
export const isMobile = ref(window.innerWidth <= 768);

export function onResize() {
  isMobile.value = window.innerWidth <= 768;
}

// --- Computed ---
export const activeFile = computed(() => {
  if (!activeFileId.value) return null;
  return files.value.find(f => f.path === activeFileId.value) || null;
});

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
    list = list.filter(f =>
      f.name.toLowerCase().includes(q) ||
      (f.content || '').toLowerCase().includes(q)
    );
  }
  return list.slice().sort((a, b) => a.name.localeCompare(b.name));
});

// --- Helpers ---
export function getFolderName(folderId) {
  if (!folderId) return 'Raiz';
  const f = folders.value.find(x => x.id === folderId);
  return f ? f.name : 'Raiz';
}
