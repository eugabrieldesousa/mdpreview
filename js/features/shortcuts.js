// Responsabilidade: Atalhos de teclado globais

import { activeFile } from '../state.js';
import { toggleMode } from './settings.js';
import { createFile, saveActiveFile } from './notes.js';

export function onKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault();
    if (activeFile.value) toggleMode();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    createFile();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (activeFile.value) saveActiveFile();
  }
}
