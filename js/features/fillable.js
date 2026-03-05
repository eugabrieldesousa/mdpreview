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
    const hasFields = fileFields.some(f => f.blockHash === hash);
    wrapper.classList.toggle('has-fill-fields', hasFields);
  });
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
