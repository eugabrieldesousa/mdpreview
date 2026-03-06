// Responsabilidade: Integração GitHub — conectar repo, listar/ler/criar/editar/excluir arquivos .md via API

const { ref, computed, nextTick } = Vue;

import { showToast } from '../components/toast.js';
import { refreshIcons, uuid } from '../utils.js';

// --- Estado GitHub ---
export const ghToken = ref(localStorage.getItem('mdv_gh_token') || '');
export const ghOwner = ref(localStorage.getItem('mdv_gh_owner') || '');
export const ghRepo = ref(localStorage.getItem('mdv_gh_repo') || '');
export const ghConnected = ref(false);
export const ghShowModal = ref(false);
export const ghShowBrowser = ref(false);
export const ghLoading = ref(false);
export const ghRepos = ref([]);
export const ghFiles = ref([]);
export const ghCurrentPath = ref('');
export const ghActiveFile = ref(null); // { path, content, sha, name }
export const ghEditMode = ref(false);
export const ghEditContent = ref('');
export const ghError = ref('');
export const ghNewFileName = ref('');
export const ghShowNewFile = ref(false);
export const ghCommitMsg = ref('');

const API = 'https://api.github.com';

function headers() {
  return {
    'Authorization': 'Bearer ' + ghToken.value,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
}

// --- Conexão ---
export async function ghConnect() {
  if (!ghToken.value.trim()) {
    ghError.value = 'Token é obrigatório';
    return;
  }
  ghLoading.value = true;
  ghError.value = '';
  try {
    const res = await fetch(API + '/user', { headers: headers() });
    if (!res.ok) throw new Error('Token inválido');
    const user = await res.json();
    ghOwner.value = user.login;
    localStorage.setItem('mdv_gh_token', ghToken.value);
    localStorage.setItem('mdv_gh_owner', ghOwner.value);
    ghConnected.value = true;
    await ghLoadRepos();
    showToast('Conectado ao GitHub como ' + user.login);
  } catch (e) {
    ghError.value = e.message || 'Erro ao conectar';
  } finally {
    ghLoading.value = false;
  }
}

export function ghDisconnect() {
  ghToken.value = '';
  ghOwner.value = '';
  ghRepo.value = '';
  ghConnected.value = false;
  ghRepos.value = [];
  ghFiles.value = [];
  ghActiveFile.value = null;
  ghCurrentPath.value = '';
  ghShowBrowser.value = false;
  localStorage.removeItem('mdv_gh_token');
  localStorage.removeItem('mdv_gh_owner');
  localStorage.removeItem('mdv_gh_repo');
  showToast('Desconectado do GitHub');
}

// --- Repositórios ---
export async function ghLoadRepos() {
  ghLoading.value = true;
  try {
    const res = await fetch(API + '/user/repos?per_page=100&sort=updated&affiliation=owner', { headers: headers() });
    if (!res.ok) throw new Error('Erro ao carregar repositórios');
    ghRepos.value = await res.json();
  } catch (e) {
    ghError.value = e.message;
  } finally {
    ghLoading.value = false;
  }
}

export async function ghSelectRepo(repo) {
  ghRepo.value = repo.name;
  ghOwner.value = repo.owner.login;
  localStorage.setItem('mdv_gh_repo', repo.name);
  localStorage.setItem('mdv_gh_owner', repo.owner.login);
  ghCurrentPath.value = '';
  ghActiveFile.value = null;
  ghShowModal.value = false;
  ghShowBrowser.value = true;
  await ghLoadFiles('');
  nextTick(refreshIcons);
}

// --- Navegar arquivos ---
export async function ghLoadFiles(path) {
  ghLoading.value = true;
  ghError.value = '';
  try {
    const url = API + '/repos/' + encodeURIComponent(ghOwner.value) + '/' + encodeURIComponent(ghRepo.value) + '/contents/' + path;
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) throw new Error('Erro ao carregar arquivos');
    const data = await res.json();
    const items = Array.isArray(data) ? data : [data];
    ghFiles.value = items
      .filter(f => f.type === 'dir' || f.name.endsWith('.md'))
      .sort((a, b) => {
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
      });
    ghCurrentPath.value = path;
  } catch (e) {
    ghError.value = e.message;
  } finally {
    ghLoading.value = false;
    nextTick(refreshIcons);
  }
}

export function ghNavigateUp() {
  const parts = ghCurrentPath.value.split('/').filter(Boolean);
  parts.pop();
  const newPath = parts.join('/');
  ghActiveFile.value = null;
  ghLoadFiles(newPath);
}

export function ghOpenItem(item) {
  if (item.type === 'dir') {
    ghActiveFile.value = null;
    ghLoadFiles(item.path);
  } else {
    ghOpenFile(item.path);
  }
}

// --- Ler arquivo ---
export async function ghOpenFile(path) {
  ghLoading.value = true;
  ghError.value = '';
  try {
    const url = API + '/repos/' + encodeURIComponent(ghOwner.value) + '/' + encodeURIComponent(ghRepo.value) + '/contents/' + path;
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) throw new Error('Erro ao abrir arquivo');
    const data = await res.json();
    const content = decodeBase64(data.content);
    ghActiveFile.value = {
      path: data.path,
      name: data.name,
      sha: data.sha,
      content: content
    };
    ghEditMode.value = false;
    ghEditContent.value = content;
  } catch (e) {
    ghError.value = e.message;
  } finally {
    ghLoading.value = false;
    nextTick(refreshIcons);
  }
}

// --- Criar arquivo ---
export async function ghCreateFile() {
  let name = ghNewFileName.value.trim();
  if (!name) return;
  if (!name.endsWith('.md')) name += '.md';
  const path = ghCurrentPath.value ? ghCurrentPath.value + '/' + name : name;
  ghLoading.value = true;
  ghError.value = '';
  try {
    const url = API + '/repos/' + encodeURIComponent(ghOwner.value) + '/' + encodeURIComponent(ghRepo.value) + '/contents/' + path;
    const body = {
      message: 'Criar ' + name + ' via MD Viewer',
      content: encodeBase64('# ' + name.replace('.md', '') + '\n')
    };
    const res = await fetch(url, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Erro ao criar arquivo');
    }
    ghShowNewFile.value = false;
    ghNewFileName.value = '';
    showToast('Arquivo criado');
    await ghLoadFiles(ghCurrentPath.value);
    await ghOpenFile(path);
  } catch (e) {
    ghError.value = e.message;
  } finally {
    ghLoading.value = false;
  }
}

// --- Salvar arquivo (update) ---
export async function ghSaveFile() {
  if (!ghActiveFile.value) return;
  ghLoading.value = true;
  ghError.value = '';
  const msg = ghCommitMsg.value.trim() || 'Atualizar ' + ghActiveFile.value.name + ' via MD Viewer';
  try {
    const url = API + '/repos/' + encodeURIComponent(ghOwner.value) + '/' + encodeURIComponent(ghRepo.value) + '/contents/' + ghActiveFile.value.path;
    const body = {
      message: msg,
      content: encodeBase64(ghEditContent.value),
      sha: ghActiveFile.value.sha
    };
    const res = await fetch(url, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Erro ao salvar');
    }
    const data = await res.json();
    ghActiveFile.value.sha = data.content.sha;
    ghActiveFile.value.content = ghEditContent.value;
    ghEditMode.value = false;
    ghCommitMsg.value = '';
    showToast('Salvo no GitHub');
  } catch (e) {
    ghError.value = e.message;
  } finally {
    ghLoading.value = false;
  }
}

// --- Excluir arquivo ---
export async function ghDeleteFile() {
  if (!ghActiveFile.value) return;
  if (!confirm('Excluir "' + ghActiveFile.value.name + '" do repositório?')) return;
  ghLoading.value = true;
  ghError.value = '';
  try {
    const url = API + '/repos/' + encodeURIComponent(ghOwner.value) + '/' + encodeURIComponent(ghRepo.value) + '/contents/' + ghActiveFile.value.path;
    const body = {
      message: 'Excluir ' + ghActiveFile.value.name + ' via MD Viewer',
      sha: ghActiveFile.value.sha
    };
    const res = await fetch(url, {
      method: 'DELETE',
      headers: headers(),
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Erro ao excluir');
    ghActiveFile.value = null;
    showToast('Arquivo excluído');
    await ghLoadFiles(ghCurrentPath.value);
  } catch (e) {
    ghError.value = e.message;
  } finally {
    ghLoading.value = false;
  }
}

// --- Renderizar markdown do GitHub ---
export const ghRenderedMarkdown = computed(() => {
  if (!ghActiveFile.value) return '';
  const raw = ghActiveFile.value.content || '';
  marked.setOptions({
    highlight: (code, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        try { return hljs.highlight(code, { language: lang }).value; } catch {}
      }
      return hljs.highlightAuto(code).value;
    },
    breaks: true, gfm: true
  });
  return marked.parse(raw);
});

// --- Importar para local ---
export function ghImportToLocal(files, folders, persist) {
  if (!ghActiveFile.value) return;
  const defaultFolder = folders.value[0];
  const newFile = {
    id: uuid(),
    name: ghActiveFile.value.name.replace('.md', ''),
    content: ghActiveFile.value.content,
    folder: defaultFolder ? defaultFolder.id : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  files.value.push(newFile);
  persist();
  showToast('Importado para notas locais');
}

// --- Reconectar automaticamente ---
export async function ghAutoConnect() {
  const token = localStorage.getItem('mdv_gh_token');
  const repo = localStorage.getItem('mdv_gh_repo');
  const owner = localStorage.getItem('mdv_gh_owner');
  if (token && owner) {
    ghToken.value = token;
    ghOwner.value = owner;
    ghConnected.value = true;
    if (repo) {
      ghRepo.value = repo;
    }
  }
}

// --- Base64 helpers (suporte UTF-8) ---
function encodeBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function decodeBase64(b64) {
  const raw = atob(b64.replace(/\n/g, ''));
  try {
    return decodeURIComponent(escape(raw));
  } catch {
    return raw;
  }
}
