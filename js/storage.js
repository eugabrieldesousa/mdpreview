// Responsabilidade: Abstração do localStorage — token GitHub, configurações e metadados locais

const KEYS = {
  GH_TOKEN: 'mdv_gh_token',
  GH_OWNER: 'mdv_gh_owner',
  GH_REPO: 'mdv_gh_repo',
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

// --- GitHub credentials ---
export function loadGhToken() { return localStorage.getItem(KEYS.GH_TOKEN) || ''; }
export function saveGhToken(val) { localStorage.setItem(KEYS.GH_TOKEN, val); }
export function loadGhOwner() { return localStorage.getItem(KEYS.GH_OWNER) || ''; }
export function saveGhOwner(val) { localStorage.setItem(KEYS.GH_OWNER, val); }
export function loadGhRepo() { return localStorage.getItem(KEYS.GH_REPO) || ''; }
export function saveGhRepo(val) { localStorage.setItem(KEYS.GH_REPO, val); }
export function clearGhCredentials() {
  localStorage.removeItem(KEYS.GH_TOKEN);
  localStorage.removeItem(KEYS.GH_OWNER);
  localStorage.removeItem(KEYS.GH_REPO);
}

// --- Settings ---
export function loadSettings() {
  return load(KEYS.SETTINGS, {
    dark: window.matchMedia('(prefers-color-scheme: dark)').matches !== false,
    fontSize: 15,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif",
    accentColor: '#0A84FF',
  });
}

export function saveSettings(data) {
  save(KEYS.SETTINGS, data);
}

// --- Fillable fields ---
export function loadFillable() { return load(KEYS.FILLABLE, []); }
export function saveFillable(data) { save(KEYS.FILLABLE, data); }

// --- Bookmarks ---
export function loadBookmarks() { return load(KEYS.BOOKMARKS, []); }
export function saveBookmarks(data) { save(KEYS.BOOKMARKS, data); }

// --- Collapsed sections ---
export function loadCollapsed() { return load(KEYS.COLLAPSED, {}); }
export function saveCollapsed(data) { save(KEYS.COLLAPSED, data); }
