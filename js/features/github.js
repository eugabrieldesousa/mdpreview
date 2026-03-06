// Responsabilidade: Camada de dados GitHub — API para CRUD de arquivos via repositório

const { nextTick } = Vue;

import {
  ghToken, ghOwner, ghRepo, ghConnected, ghScreen,
  ghRepos, ghLoading, ghSaving, ghError,
  files, folders, activeFileId, hasUnsavedChanges
} from '../state.js';
import { saveGhToken, saveGhOwner, saveGhRepo, clearGhCredentials } from '../storage.js';
import { showToast } from '../components/toast.js';
import { refreshIcons } from '../utils.js';

const API = 'https://api.github.com';

function headers() {
  return {
    'Authorization': 'Bearer ' + ghToken.value,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
}

function encodeBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function decodeBase64(b64) {
  const raw = atob(b64.replace(/\n/g, ''));
  try { return decodeURIComponent(escape(raw)); }
  catch { return raw; }
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
    saveGhToken(ghToken.value);
    saveGhOwner(ghOwner.value);
    ghConnected.value = true;
    ghScreen.value = 'repos';
    await ghLoadRepos();
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
  files.value = [];
  folders.value = [];
  activeFileId.value = null;
  hasUnsavedChanges.value = false;
  ghScreen.value = 'login';
  clearGhCredentials();
  showToast('Desconectado');
}

// --- Repositórios ---
export async function ghLoadRepos() {
  ghLoading.value = true;
  ghError.value = '';
  try {
    const res = await fetch(API + '/user/repos?per_page=100&sort=updated&affiliation=owner', { headers: headers() });
    if (!res.ok) throw new Error('Erro ao carregar repositórios');
    ghRepos.value = await res.json();
  } catch (e) {
    ghError.value = e.message;
  } finally {
    ghLoading.value = false;
    nextTick(refreshIcons);
  }
}

export async function ghSelectRepo(repo) {
  ghRepo.value = repo.name;
  ghOwner.value = repo.owner.login;
  saveGhRepo(repo.name);
  saveGhOwner(repo.owner.login);
  ghError.value = '';
  await loadRepoTree();
  ghScreen.value = 'app';
  nextTick(refreshIcons);
}

export async function ghChangeRepo() {
  files.value = [];
  folders.value = [];
  activeFileId.value = null;
  hasUnsavedChanges.value = false;
  ghScreen.value = 'repos';
  await ghLoadRepos();
}

// --- Carregar árvore do repositório ---
async function getDefaultBranch() {
  const res = await fetch(
    API + '/repos/' + encodeURIComponent(ghOwner.value) + '/' + encodeURIComponent(ghRepo.value),
    { headers: headers() }
  );
  if (!res.ok) throw new Error('Erro ao acessar repositório');
  const repo = await res.json();
  return repo.default_branch || 'main';
}

export async function loadRepoTree() {
  ghLoading.value = true;
  ghError.value = '';
  try {
    const branch = await getDefaultBranch();
    const res = await fetch(
      API + '/repos/' + encodeURIComponent(ghOwner.value) + '/' + encodeURIComponent(ghRepo.value) +
      '/git/trees/' + branch + '?recursive=1',
      { headers: headers() }
    );
    if (!res.ok) throw new Error('Erro ao carregar arquivos');
    const data = await res.json();

    const mdFiles = [];
    const dirSet = new Set();

    for (const item of data.tree) {
      if (item.type === 'blob' && item.path.endsWith('.md')) {
        const parts = item.path.split('/');
        const name = parts[parts.length - 1];
        const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
        mdFiles.push({ path: item.path, name, sha: item.sha, folder, content: undefined });
        if (folder) dirSet.add(folder);
      }
      if (item.type === 'tree') {
        dirSet.add(item.path);
      }
    }

    files.value = mdFiles;
    folders.value = Array.from(dirSet).sort().map(d => ({ id: d, name: d }));
  } catch (e) {
    ghError.value = e.message;
  } finally {
    ghLoading.value = false;
  }
}

// --- Ler conteúdo de arquivo ---
export async function fetchFileContent(file) {
  ghLoading.value = true;
  ghError.value = '';
  try {
    const url = API + '/repos/' + encodeURIComponent(ghOwner.value) + '/' + encodeURIComponent(ghRepo.value) + '/contents/' + file.path;
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) throw new Error('Erro ao ler arquivo');
    const data = await res.json();
    file.content = decodeBase64(data.content);
    file.sha = data.sha;
  } catch (e) {
    ghError.value = e.message;
  } finally {
    ghLoading.value = false;
  }
}

// --- Salvar arquivo (commit) ---
export async function saveFile(file) {
  ghSaving.value = true;
  ghError.value = '';
  try {
    const url = API + '/repos/' + encodeURIComponent(ghOwner.value) + '/' + encodeURIComponent(ghRepo.value) + '/contents/' + file.path;
    const body = {
      message: 'Atualizar ' + file.name + ' via MD Viewer',
      content: encodeBase64(file.content),
      sha: file.sha
    };
    const res = await fetch(url, { method: 'PUT', headers: headers(), body: JSON.stringify(body) });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Erro ao salvar');
    }
    const data = await res.json();
    file.sha = data.content.sha;
    hasUnsavedChanges.value = false;
    showToast('Salvo no GitHub');
  } catch (e) {
    ghError.value = e.message;
    showToast('Erro ao salvar');
  } finally {
    ghSaving.value = false;
  }
}

// --- Criar arquivo ---
export async function createFileOnGitHub(path, content) {
  ghLoading.value = true;
  ghError.value = '';
  try {
    const url = API + '/repos/' + encodeURIComponent(ghOwner.value) + '/' + encodeURIComponent(ghRepo.value) + '/contents/' + path;
    const body = {
      message: 'Criar ' + path.split('/').pop() + ' via MD Viewer',
      content: encodeBase64(content)
    };
    const res = await fetch(url, { method: 'PUT', headers: headers(), body: JSON.stringify(body) });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Erro ao criar arquivo');
    }
    const data = await res.json();
    return { path: data.content.path, name: data.content.name, sha: data.content.sha };
  } catch (e) {
    ghError.value = e.message;
    throw e;
  } finally {
    ghLoading.value = false;
  }
}

// --- Excluir arquivo ---
export async function deleteFileOnGitHub(path, sha) {
  ghLoading.value = true;
  ghError.value = '';
  try {
    const url = API + '/repos/' + encodeURIComponent(ghOwner.value) + '/' + encodeURIComponent(ghRepo.value) + '/contents/' + path;
    const body = {
      message: 'Excluir ' + path.split('/').pop() + ' via MD Viewer',
      sha: sha
    };
    const res = await fetch(url, { method: 'DELETE', headers: headers(), body: JSON.stringify(body) });
    if (!res.ok) throw new Error('Erro ao excluir');
  } catch (e) {
    ghError.value = e.message;
    throw e;
  } finally {
    ghLoading.value = false;
  }
}

// --- Renomear arquivo (create new + delete old) ---
export async function renameFileOnGitHub(oldPath, oldSha, newPath, content) {
  ghLoading.value = true;
  ghError.value = '';
  try {
    const createUrl = API + '/repos/' + encodeURIComponent(ghOwner.value) + '/' + encodeURIComponent(ghRepo.value) + '/contents/' + newPath;
    const createBody = {
      message: 'Renomear ' + oldPath.split('/').pop() + ' para ' + newPath.split('/').pop() + ' via MD Viewer',
      content: encodeBase64(content)
    };
    const createRes = await fetch(createUrl, { method: 'PUT', headers: headers(), body: JSON.stringify(createBody) });
    if (!createRes.ok) throw new Error('Erro ao criar novo arquivo');
    const createData = await createRes.json();

    const deleteUrl = API + '/repos/' + encodeURIComponent(ghOwner.value) + '/' + encodeURIComponent(ghRepo.value) + '/contents/' + oldPath;
    const deleteBody = {
      message: 'Remover ' + oldPath.split('/').pop() + ' (renomeado) via MD Viewer',
      sha: oldSha
    };
    await fetch(deleteUrl, { method: 'DELETE', headers: headers(), body: JSON.stringify(deleteBody) });

    return { path: createData.content.path, name: createData.content.name, sha: createData.content.sha };
  } catch (e) {
    ghError.value = e.message;
    throw e;
  } finally {
    ghLoading.value = false;
  }
}

// --- Auto-connect ---
export async function ghAutoConnect() {
  if (!ghToken.value) {
    ghScreen.value = 'login';
    return;
  }

  ghConnected.value = true;

  if (ghRepo.value && ghOwner.value) {
    try {
      await loadRepoTree();
      ghScreen.value = 'app';
    } catch {
      ghScreen.value = 'repos';
      await ghLoadRepos();
    }
  } else {
    ghScreen.value = 'repos';
    await ghLoadRepos();
  }

  nextTick(refreshIcons);
}
