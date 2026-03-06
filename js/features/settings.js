// Responsabilidade: Configurações de tema, fonte e aparência

const { nextTick } = Vue;

import { isDark, fontSize, fontFamily, editMode, accentColor } from '../state.js';
import { saveSettings } from '../storage.js';
import { refreshIcons } from '../utils.js';

function persistSettings() {
  saveSettings({ dark: isDark.value, fontSize: fontSize.value, fontFamily: fontFamily.value, accentColor: accentColor.value });
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

// --- Accent Color ---
export const accentPresets = [
  { value: '#0A84FF', label: 'Azul' },
  { value: '#BF5AF2', label: 'Roxo' },
  { value: '#FF375F', label: 'Rosa' },
  { value: '#FF9F0A', label: 'Laranja' },
  { value: '#32D74B', label: 'Verde' },
  { value: '#64D2FF', label: 'Ciano' },
];

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

export function applyAccentColor() {
  const hex = accentColor.value;
  if (!hex) return;
  const { r, g, b } = hexToRgb(hex);
  const root = document.documentElement;
  root.style.setProperty('--accent', hex);
  root.style.setProperty('--accent-dim', `rgba(${r},${g},${b},0.60)`);
  root.style.setProperty('--accent-faint', `rgba(${r},${g},${b},0.35)`);
  root.style.setProperty('--list-active', `rgba(${r},${g},${b},0.16)`);
}

export function changeAccentColor(hex) {
  accentColor.value = hex;
  applyAccentColor();
  persistSettings();
}
