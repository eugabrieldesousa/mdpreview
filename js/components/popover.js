// Responsabilidade: Popover de seleção de texto no preview markdown

const { nextTick } = Vue;

import { popover, selectedText, activeFile, hasUnsavedChanges } from '../state.js';
import { refreshIcons } from '../utils.js';
import { showToast } from './toast.js';

export function onTextSelect(e) {
  if (!e.target.closest || !e.target.closest('.markdown-body')) return;
  const sel = window.getSelection();
  const text = sel ? sel.toString().trim() : '';
  if (text.length > 0) {
    const inCodeBlock = !!e.target.closest('.code-block-wrapper');
    selectedText.value = text;
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    popover.value = {
      visible: true,
      x: rect.left + rect.width / 2 - 70,
      y: rect.top - 44,
      text,
      inCodeBlock,
    };
    nextTick(refreshIcons);
  }
}

export function hidePopover() {
  popover.value.visible = false;
}

export function copySelection() {
  navigator.clipboard.writeText(selectedText.value);
  popover.value.visible = false;
  showToast('Copiado com sucesso');
}

export function quoteSelection() {
  if (activeFile.value) {
    const quoted = selectedText.value.split('\n').map(l => '> ' + l).join('\n');
    activeFile.value.content += '\n\n' + quoted + '\n';
    hasUnsavedChanges.value = true;
    popover.value.visible = false;
    showToast('Citacao adicionada');
  }
}

export function onDocClick() {
  if (popover.value.visible) {
    const sel = window.getSelection();
    if (!sel || sel.toString().trim().length === 0) {
      popover.value.visible = false;
    }
  }
}
