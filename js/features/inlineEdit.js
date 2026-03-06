// Responsabilidade: Edição inline de textos simples no modo preview

import { activeFile, editMode, persist, popover } from '../state.js';
import { showToast } from '../components/toast.js';

let currentEditing = null;
let originalText = '';

export function onInlineEdit(e) {
  if (editMode.value || !activeFile.value) return;
  const el = e.target.nodeType === 3 ? e.target.parentElement : e.target;
  if (!el) return;
  const target = el.closest('p, h1, h2, h3, h4, h5, h6, li, td, th');
  if (!target) return;
  if (target.closest('.code-block-wrapper')) return;
  if (target.querySelector('strong, em, a, code, img')) return;
  if (currentEditing) return;
  popover.value.visible = false;
  window.getSelection().removeAllRanges();
  currentEditing = target;
  originalText = target.textContent;
  target.setAttribute('contenteditable', 'true');
  target.classList.add('inline-editing');
  target.focus();
  const range = document.createRange();
  range.selectNodeContents(target);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  target.addEventListener('blur', finishInlineEdit);
  target.addEventListener('keydown', onInlineKeydown);
}

function onInlineKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    currentEditing.textContent = originalText;
    cleanup();
  } else if (e.key === 'Enter' && !e.shiftKey) {
    const tag = currentEditing.tagName;
    if (tag !== 'LI') {
      e.preventDefault();
      currentEditing.blur();
    }
  }
}

function finishInlineEdit() {
  if (!currentEditing) return;
  const newText = currentEditing.textContent.trim();
  if (!newText || newText === originalText.trim()) {
    currentEditing.textContent = originalText;
    cleanup();
    return;
  }
  const content = activeFile.value.content;
  const tag = currentEditing.tagName;
  let updated = false;
  if (/^H[1-6]$/.test(tag)) {
    const level = parseInt(tag[1]);
    const prefix = '#'.repeat(level) + ' ';
    const re = new RegExp('^#{' + level + '}\\s+' + escRegex(originalText.trim()), 'm');
    if (re.test(content)) {
      activeFile.value.content = content.replace(re, prefix + newText);
      updated = true;
    }
  } else {
    const idx = content.indexOf(originalText.trim());
    if (idx !== -1) {
      activeFile.value.content = content.substring(0, idx) + newText + content.substring(idx + originalText.trim().length);
      updated = true;
    }
  }
  if (updated) {
    activeFile.value.updatedAt = new Date().toISOString();
    const m = activeFile.value.content.match(/^#\s+(.+)/m);
    if (m) activeFile.value.name = m[1].trim();
    persist();
    showToast('Texto atualizado');
  }
  cleanup();
}

function cleanup() {
  if (!currentEditing) return;
  currentEditing.removeAttribute('contenteditable');
  currentEditing.classList.remove('inline-editing');
  currentEditing.removeEventListener('blur', finishInlineEdit);
  currentEditing.removeEventListener('keydown', onInlineKeydown);
  currentEditing = null;
  originalText = '';
}

function escRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
