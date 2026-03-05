// Responsabilidade: Configurações de tema, fonte e aparência

const { nextTick } = Vue;

import { isDark, fontSize, fontFamily, editMode } from '../state.js';
import { saveSettings } from '../storage.js';
import { refreshIcons } from '../utils.js';

function persistSettings() {
  saveSettings({ dark: isDark.value, fontSize: fontSize.value, fontFamily: fontFamily.value });
}

export function applyTheme() {
  document.documentElement.className = isDark.value ? '' : 'light';
  const link = document.getElementById('hljs-theme');
  link.href = isDark.value
    ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
    : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
}

export function applyFont() {
  document.documentElement.style.setProperty('--font-size', fontSize.value + 'px');
  document.documentElement.style.setProperty('--font-family', fontFamily.value);
}

export function toggleTheme() {
  isDark.value = !isDark.value;
  applyTheme();
  persistSettings();
}

export function changeFontSize(d) {
  const v = fontSize.value + d;
  if (v >= 12 && v <= 24) {
    fontSize.value = v;
    applyFont();
    persistSettings();
  }
}

export function saveFontFamily() {
  applyFont();
  persistSettings();
}

export function toggleMode() {
  editMode.value = !editMode.value;
  nextTick(refreshIcons);
}
