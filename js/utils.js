// Responsabilidade: Funções utilitárias puras e helpers compartilhados

export function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function getTitle(f) {
  if (!f) return 'Sem titulo';
  if (f.content) {
    const m = f.content.match(/^#\s+(.+)/m);
    if (m) return m[1].trim();
  }
  return f.name ? f.name.replace(/\.md$/, '') : 'Sem titulo';
}

export function getPreview(f) {
  if (!f || !f.content) return '';
  const lines = (f.content || '').split('\n').filter(l => l.trim() && !l.startsWith('#'));
  return (lines[0] || '').substring(0, 60) || 'Sem conteudo';
}

export function blockHash(content) {
  const str = content.substring(0, 80);
  try { return btoa(unescape(encodeURIComponent(str))); } catch { return btoa(str.replace(/[^\x00-\x7F]/g, '')); }
}

export function decodeRaw(raw) {
  return raw.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
}

export function refreshIcons() {
  try { lucide.createIcons(); } catch {}
}
