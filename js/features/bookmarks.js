// Responsabilidade: Atalhos de texto (bookmarks) — criar, navegar, remover, indicadores visuais

const { computed, nextTick } = Vue;

import { bookmarksData, activeFile, showBookmarks, editMode, markdownBody, selectedText, popover } from '../state.js';
import { saveBookmarks } from '../storage.js';
import { uuid } from '../utils.js';
import { showToast } from '../components/toast.js';

function persistBookmarks() {
  saveBookmarks(bookmarksData.value);
}

function getDocPosition(content, anchor) {
  if (!content || !anchor) return Infinity;
  const idx = content.indexOf(anchor);
  return idx === -1 ? Infinity : idx;
}

export const currentFileBookmarks = computed(() => {
  if (!activeFile.value) return [];
  const content = activeFile.value.content || '';
  return bookmarksData.value
    .filter(b => b.filePath === activeFile.value.path)
    .sort((a, b) => getDocPosition(content, a.anchor) - getDocPosition(content, b.anchor));
});

export function addBookmarkFromSelection() {
  if (!selectedText.value || !activeFile.value) return;
  const label = selectedText.value.substring(0, 120);
  const exists = bookmarksData.value.some(
    b => b.filePath === activeFile.value.path && b.label === label
  );
  if (exists) {
    showToast('Atalho ja existe');
    popover.value.visible = false;
    return;
  }
  bookmarksData.value.push({
    id: uuid(),
    filePath: activeFile.value.path,
    label: label,
    anchor: label,
    createdAt: new Date().toISOString()
  });
  persistBookmarks();
  popover.value.visible = false;
  window.getSelection().removeAllRanges();
  showToast('Atalho criado');
}

export function removeBookmark(id) {
  bookmarksData.value = bookmarksData.value.filter(b => b.id !== id);
  persistBookmarks();
  showToast('Atalho removido');
}

export function navigateToBookmark(bm) {
  showBookmarks.value = false;
  if (editMode.value) {
    editMode.value = false;
  }
  nextTick(() => {
    setTimeout(() => {
      const mbEl = markdownBody.value;
      if (!mbEl) return;
      const walker = document.createTreeWalker(mbEl, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.includes(bm.anchor)) {
          const el = node.parentElement;
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('bookmark-highlight');
            setTimeout(() => {
              el.classList.remove('bookmark-highlight');
            }, 1800);
            break;
          }
        }
      }
    }, 100);
  });
}

export function applyBookmarkIndicators() {
  const mbEl = markdownBody.value;
  if (!mbEl || !activeFile.value) return;
  mbEl.querySelectorAll('.bookmark-indicator').forEach(el => el.remove());
  const bookmarks = bookmarksData.value.filter(b => b.filePath === activeFile.value.path);
  if (!bookmarks.length) return;

  const walker = document.createTreeWalker(mbEl, NodeFilter.SHOW_TEXT, null, false);
  let node;
  const matched = new Set();
  while (node = walker.nextNode()) {
    for (const bm of bookmarks) {
      if (matched.has(bm.id)) continue;
      if (node.textContent.includes(bm.anchor)) {
        const el = node.parentElement;
        if (el && !el.querySelector('.bookmark-indicator')) {
          const indicator = document.createElement('span');
          indicator.className = 'bookmark-indicator';
          indicator.setAttribute('title', 'Atalho: ' + bm.label);
          indicator.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>';
          el.classList.add('bookmark-marked');
          el.insertBefore(indicator, el.firstChild);
          matched.add(bm.id);
        }
      }
    }
  }
}
