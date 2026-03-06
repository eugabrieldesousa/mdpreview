// Responsabilidade: Exportação de notas individuais

import { activeFile } from '../state.js';
import { showToast } from '../components/toast.js';

export function exportSingle() {
  if (!activeFile.value) return;
  const blob = new Blob([activeFile.value.content || ''], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = activeFile.value.name || 'nota.md'; a.click();
  URL.revokeObjectURL(url);
  showToast('Nota exportada');
}
