# CLAUDE.md — MD Viewer

## 1. O que é
Editor/visualizador de notas Markdown no browser. 100% frontend, sem build tools, persistência via localStorage, deploy via GitHub Pages.

## 2. Stack e versões
- Vue 3 (CDN global: `vue.global.prod.js`) — Options API não usada, somente Composition API (`setup()`)
- marked.js (CDN latest) — renderização Markdown
- highlight.js 11.9.0 (CDN) — syntax highlighting
- Lucide Icons (CDN latest) — ícones SVG
- ES Modules nativos (sem bundler)
- CSS puro com custom properties (sem pré-processador)

## 3. Comandos essenciais
- **Dev**: servir com qualquer HTTP server (`npx serve`, Live Server do VS Code)
- **Deploy**: push para GitHub → Pages serve `index.html` da raiz
- **Build/Test/Lint**: não existem — sem toolchain

## 4. Estrutura de pastas
```
├── index.html                  # Shell: CDNs, CSS links, template Vue, <script type="module" src="js/app.js">
├── styles/
│   ├── base.css                # CSS vars (:root dark, .light), reset, animações, hljs overrides
│   ├── components.css          # Estilos de sidebar, notes list, editor, modals, toast, popover, buttons, forms, code blocks, bookmarks, fill fields
│   └── layout.css              # #app flex, drawer overlay, mobile toggle, @media ≤768px
├── js/
│   ├── app.js                  # Entry point: cria Vue app, registra window.__copyCode/__openFillModal, lifecycle, watchers
│   ├── state.js                # Todos os refs e computed (fonte única de verdade). Importa storage.js na init
│   ├── storage.js              # Única camada que toca localStorage. Keys: mdv_files, mdv_folders, mdv_settings, mdv_fillable, mdv_bookmarks
│   ├── utils.js                # Funções puras: uuid, formatDate, getTitle, getPreview, blockHash, decodeRaw, refreshIcons
│   ├── components/
│   │   ├── toast.js            # showToast(msg) — auto-dismiss 2.2s
│   │   └── popover.js          # Menu contextual ao selecionar texto (copy, quote, add field, add bookmark)
│   └── features/
│       ├── folders.js          # CRUD pastas + rename inline
│       ├── notes.js            # CRUD notas + rename modal + auto-name from H1
│       ├── markdown.js         # computed renderedMarkdown + custom marked.Renderer para code blocks
│       ├── settings.js         # toggleTheme, changeFontSize, saveFontFamily, toggleMode
│       ├── fillable.js         # Seleção de trechos em code blocks → modal de preenchimento → cópia com substituição
│       ├── bookmarks.js        # Atalhos de texto com navegação scroll+highlight
│       ├── importExport.js     # Export JSON/MD, import com detecção de conflitos
│       └── shortcuts.js        # Ctrl+P (toggle edit), Ctrl+N (nova nota)
```

## 5. Padrões de código
- Todo `.js` começa com `// Responsabilidade: [1 linha]`
- Named exports apenas (`export function`), zero `export default`
- Vue globals do CDN via destructuring: `const { ref, computed } = Vue`
- Libs externas (marked, hljs, lucide) acessadas como globals — nunca importadas
- Estado reativo centralizado em `state.js` — features só importam refs de lá
- `storage.js` é barreira: nenhum outro arquivo usa `localStorage` diretamente
- Tema via classe `.light` no `<html>` — dark é default (sem classe)
- CSS vars com naming iOS-inspired: `--space-{1..12}`, `--radius-{sm..full}`, `--text-{xs..3xl}`
- camelCase para JS, kebab-case para CSS classes
- Callbacks inline em HTML renderizado via `window.__copyCode` / `window.__openFillModal`

## 6. Componentes e helpers reutilizáveis
- `showToast(msg)` — notificação universal, usado por quase toda feature
- `refreshIcons()` — re-renderiza ícones Lucide após mudança de DOM
- `uuid()` — gerador de IDs para notas, pastas, bookmarks, fill fields
- `decodeRaw(html)` — decodifica entidades HTML de atributos data-raw
- `blockHash(content)` — hash base64 dos primeiros 80 chars para identificar code blocks
- `persist()` — salva files + folders de uma vez
- Botões `.btn-primary`, `.btn-ghost`, `.btn-danger` — reutilizáveis em qualquer modal

## 7. O que NUNCA fazer
- **Acessar `localStorage` fora de `storage.js`** — quebra a abstração
- **Importar de `app.js`** — causa dependência circular (app importa tudo, ninguém importa app)
- **Criar refs fora de `state.js`** — fragmenta a fonte de verdade
- **Usar `export default`** — convenção do projeto é named exports
- **Adicionar CDN sem `id`** — o hljs-theme precisa de `id="hljs-theme"` para troca dinâmica
- **Usar `file://` para testar** — ES Modules exigem HTTP(S); use servidor local ou GitHub Pages
- **Mutar `arguments` no renderer do marked** — o `renderer.code` recebe obj ou string dependendo da versão; sempre checar tipo
