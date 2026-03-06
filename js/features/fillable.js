// Responsabilidade: Campos preenchíveis em blocos de código (fill fields)

const { nextTick } = Vue;

import { fillableFields, fillModal, activeFile, markdownBody, selectedText, popover } from '../state.js';
import { saveFillable } from '../storage.js';
import { uuid, blockHash, decodeRaw, refreshIcons } from '../utils.js';
import { showToast } from '../components/toast.js';

function persistFillable() {
  saveFillable(fillableFields.value);
}

export function addFillableFromSelection() {
  if (!selectedText.value || !activeFile.value) return;
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const node = sel.anchorNode;
  const wrapper = node && node.nodeType === 3
    ? node.parentElement.closest('.code-block-wrapper')
    : node && node.closest ? node.closest('.code-block-wrapper') : null;
  if (!wrapper) {
    showToast('Selecione texto dentro de um bloco de codigo');
    popover.value.visible = false;
    return;
  }
  const raw = wrapper.getAttribute('data-raw');
  const decoded = decodeRaw(raw);
  const hash = blockHash(decoded);
  const exists = fillableFields.value.some(
    f => f.fileId === activeFile.value.id && f.blockHash === hash && f.text === selectedText.value
  );
  if (exists) {
    showToast('Campo ja existe');
    popover.value.visible = false;
    return;
  }
  fillableFields.value.push({
    id: uuid(),
    text: selectedText.value,
    fileId: activeFile.value.id,
    blockHash: hash,
    value: '',
    createdAt: new Date().toISOString()
  });
  persistFillable();
  popover.value.visible = false;
  sel.removeAllRanges();
  nextTick(() => applyFillButtons());
  showToast('Campo adicionado');
}

export function applyFillButtons() {
  const mbEl = markdownBody.value;
  if (!mbEl || !activeFile.value) return;
  const fileFields = fillableFields.value.filter(f => f.fileId === activeFile.value.id);
  mbEl.querySelectorAll('.code-block-wrapper').forEach(wrapper => {
    const raw = wrapper.getAttribute('data-raw');
    const decoded = decodeRaw(raw);
    const hash = blockHash(decoded);
    const blockFields = fileFields.filter(f => f.blockHash === hash);
    const hasFields = blockFields.length > 0;
    wrapper.classList.toggle('has-fill-fields', hasFields);
    const codeEl = wrapper.querySelector('pre code');
    if (codeEl) highlightFillVariables(codeEl, blockFields);
  });
}

function highlightFillVariables(codeEl, fields) {
  codeEl.querySelectorAll('.fill-variable').forEach(el => {
    el.replaceWith(document.createTextNode(el.textContent));
  });
  codeEl.normalize();
  if (!fields.length) return;
  const escaped = fields.map(f => f.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp('(' + escaped.join('|') + ')', 'g');
  const walker = document.createTreeWalker(codeEl, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  for (const node of textNodes) {
    if (!fields.some(f => node.textContent.includes(f.text))) continue;
    pattern.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let lastIdx = 0;
    let match;
    while ((match = pattern.exec(node.textContent)) !== null) {
      if (match.index > lastIdx) frag.appendChild(document.createTextNode(node.textContent.slice(lastIdx, match.index)));
      const span = document.createElement('span');
      span.className = 'fill-variable';
      span.textContent = match[0];
      const field = fields.find(f => f.text === match[0]);
      span.title = field && field.value ? 'Valor: ' + field.value : 'Campo preenchível';
      frag.appendChild(span);
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < node.textContent.length) frag.appendChild(document.createTextNode(node.textContent.slice(lastIdx)));
    node.parentNode.replaceChild(frag, node);
  }
}

export function openFillModal(btn) {
  const wrapper = btn.closest('.code-block-wrapper');
  const raw = wrapper.getAttribute('data-raw');
  const decoded = decodeRaw(raw);
  const hash = blockHash(decoded);
  const fields = fillableFields.value
    .filter(f => f.fileId === activeFile.value.id && f.blockHash === hash)
    .map(f => ({ id: f.id, text: f.text, value: f.value || '' }));
  if (!fields.length) return;
  fillModal.value = { visible: true, fields, blockHash: hash, blockRaw: decoded };
  nextTick(refreshIcons);
}

export function removeFillField(fieldId) {
  fillableFields.value = fillableFields.value.filter(f => f.id !== fieldId);
  persistFillable();
  fillModal.value.fields = fillModal.value.fields.filter(f => f.id !== fieldId);
  if (!fillModal.value.fields.length) {
    fillModal.value.visible = false;
  }
  nextTick(() => applyFillButtons());
  showToast('Campo removido');
}

export function copyFilledCode() {
  const fm = fillModal.value;
  let text = fm.blockRaw;
  fm.fields.forEach(f => {
    if (f.value) {
      const re = new RegExp(f.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      text = text.replace(re, f.value);
    }
  });
  fm.fields.forEach(f => {
    const stored = fillableFields.value.find(sf => sf.id === f.id);
    if (stored) stored.value = f.value;
  });
  persistFillable();
  navigator.clipboard.writeText(text);
  fillModal.value.visible = false;
  showToast('Copiado com sucesso');
}
