// Responsabilidade: Renderização Markdown com code blocks customizados

const { computed } = Vue;

import { activeFile } from '../state.js';
import { decodeRaw } from '../utils.js';
import { showToast } from '../components/toast.js';

export const renderedMarkdown = computed(() => {
  if (!activeFile.value) return '';
  const raw = activeFile.value.content || '';
  marked.setOptions({
    highlight: (code, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        try { return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value; } catch {}
      }
      try { return hljs.highlightAuto(code).value; } catch { return code; }
    },
    breaks: true, gfm: true
  });

  const renderer = new marked.Renderer();
  renderer.code = function(obj) {
    let text, lang;
    if (typeof obj === 'object' && obj !== null) {
      text = obj.text || '';
      lang = obj.lang || '';
    } else {
      text = obj || '';
      lang = arguments[1] || '';
    }
    const highlighted = lang && hljs.getLanguage(lang)
      ? hljs.highlight(text, { language: lang, ignoreIllegals: true }).value
      : hljs.highlightAuto(text).value;
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return `<div class="code-block-wrapper" data-raw="${escaped}">
      <div class="code-block-header">
        <span class="code-block-lang">${lang || 'code'}</span>
        <div class="code-block-actions">
          <button onclick="window.__copyCode(this)" aria-label="Copiar codigo" data-tooltip="Copiar código"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
          <button class="cb-fill" onclick="window.__openFillModal(this)" aria-label="Preencher" data-tooltip="Preencher campos"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Preencher</button>
        </div>
      </div>
      <pre><code class="hljs">${highlighted}</code></pre>
    </div>`;
  };

  return marked.parse(raw, { renderer });
});

export function copyCode(btn) {
  const wrapper = btn.closest('.code-block-wrapper');
  const raw = wrapper.getAttribute('data-raw');
  const decoded = decodeRaw(raw);
  navigator.clipboard.writeText(decoded);
  showToast('Copiado com sucesso');
}
