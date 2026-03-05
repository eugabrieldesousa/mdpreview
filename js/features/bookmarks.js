// Responsabilidade: Atalhos de texto (bookmarks) — criar, navegar, remover

const { computed, nextTick } = Vue;

import { bookmarksData, activeFile, showBookmarks, editMode, markdownBody, selectedText, popover } from '../state.js';
import { saveBookmarks } from '../storage.js';
import { uuid } from '../utils.js';
import { showToast } from '../components/toast.js';

function persistBookmarks() {
  saveBookmarks(bookmarksData.value);
}

export const currentFileBookmarks = computed(() => {
  if (!activeFile.value) return [];
  return bookmarksData.value
    .filter(b => b.fileId === activeFile.value.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});

export function addBookmarkFromSelection() {
  if (!selectedText.value || !activeFile.value) return;
  const label = selectedText.value.substring(0, 120);
  const exists = bookmarksData.value.some(
    b => b.fileId === activeFile.value.id && b.label === label
  );
  if (exists) {
    showToast('Atalho ja existe');
    popover.value.visible = false;
    return;
  }
  bookmarksData.value.push({
    id: uuid(),
    fileId: activeFile.value.id,
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
