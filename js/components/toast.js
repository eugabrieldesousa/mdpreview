// Responsabilidade: Componente de notificação temporária (toast)

const { nextTick } = Vue;

import { toast } from '../state.js';
import { refreshIcons } from '../utils.js';

let toastTimer = null;

export function showToast(msg) {
  if (toastTimer) clearTimeout(toastTimer);
  toast.value = { visible: true, message: msg, fading: false };
  nextTick(() => refreshIcons());
  toastTimer = setTimeout(() => {
    toast.value.fading = true;
    setTimeout(() => { toast.value.visible = false; }, 300);
  }, 2200);
}
