// Responsabilidade: Abstração do localStorage — único ponto de acesso a dados persistidos

const KEYS = {
  FILES: 'mdv_files',
  FOLDERS: 'mdv_folders',
  SETTINGS: 'mdv_settings',
  FILLABLE: 'mdv_fillable',
  BOOKMARKS: 'mdv_bookmarks',
  COLLAPSED: 'mdv_collapsed',
};

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

export function loadFiles() {
  return load(KEYS.FILES, []);
}

export function saveFiles(data) {
  save(KEYS.FILES, data);
}

export function loadFolders(defaultFolders) {
  return load(KEYS.FOLDERS, defaultFolders);
}

export function saveFolders(data) {
  save(KEYS.FOLDERS, data);
}

export function loadSettings() {
  return load(KEYS.SETTINGS, {
    dark: window.matchMedia('(prefers-color-scheme: dark)').matches !== false,
    fontSize: 15,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif",
  });
}

export function saveSettings(data) {
  save(KEYS.SETTINGS, data);
}

export function loadFillable() {
  return load(KEYS.FILLABLE, []);
}

export function saveFillable(data) {
  save(KEYS.FILLABLE, data);
}

export function loadBookmarks() {
  return load(KEYS.BOOKMARKS, []);
}

export function saveBookmarks(data) {
  save(KEYS.BOOKMARKS, data);
}

export function loadCollapsed() {
  return load(KEYS.COLLAPSED, {});
}

export function saveCollapsed(data) {
  save(KEYS.COLLAPSED, data);
}
