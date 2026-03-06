// Responsabilidade: Modal de diálogo customizado — substitui confirm() e prompt() nativos

const { ref, nextTick } = Vue;

import { refreshIcons } from '../utils.js';

export const dialog = ref({
  visible: false,
  type: 'confirm',
  title: '',
  message: '',
  inputValue: '',
  placeholder: '',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  danger: false,
  _resolve: null
});

export function showConfirm({ title, message, confirmText, cancelText, danger } = {}) {
  return new Promise(resolve => {
    dialog.value = {
      visible: true,
      type: 'confirm',
      title: title || 'Confirmar',
      message: message || '',
      inputValue: '',
      placeholder: '',
      confirmText: confirmText || 'Confirmar',
      cancelText: cancelText || 'Cancelar',
      danger: !!danger,
      _resolve: resolve
    };
    nextTick(refreshIcons);
  });
}

export function showPrompt({ title, message, placeholder, value, confirmText, cancelText } = {}) {
  return new Promise(resolve => {
    dialog.value = {
      visible: true,
      type: 'prompt',
      title: title || '',
      message: message || '',
      inputValue: value || '',
      placeholder: placeholder || '',
      confirmText: confirmText || 'Confirmar',
      cancelText: cancelText || 'Cancelar',
      danger: false,
      _resolve: resolve
    };
    nextTick(() => {
      refreshIcons();
      const input = document.querySelector('.dialog-input');
      if (input) { input.focus(); input.select(); }
    });
  });
}

export function confirmDialogAction() {
  const resolve = dialog.value._resolve;
  const type = dialog.value.type;
  const inputValue = dialog.value.inputValue;
  dialog.value.visible = false;
  if (resolve) {
    resolve(type === 'confirm' ? true : inputValue);
  }
}

export function cancelDialogAction() {
  const resolve = dialog.value._resolve;
  const type = dialog.value.type;
  dialog.value.visible = false;
  if (resolve) {
    resolve(type === 'confirm' ? false : null);
  }
}
