# MD Viewer — Arquitetura

## Visão Geral

MD Viewer é um editor/visualizador de notas Markdown 100% frontend, sem build tools, com persistência via `localStorage`. Usa Vue 3 (CDN global), marked.js, highlight.js e Lucide Icons.

## Estrutura de Pastas

```
mdviewer/
├── index.html                    # Shell: CDN imports, CSS links, template Vue
├── styles/
│   ├── base.css                  # Reset, variáveis CSS (dark/light), tipografia, animações, hljs overrides
│   ├── components.css            # Estilos de todos os componentes visuais
│   └── layout.css                # Grid principal (#app), responsividade, drawer overlay
├── js/
│   ├── app.js                    # Entry point: cria Vue app, orquestra imports, monta lifecycle/watchers
│   ├── state.js                  # Estado reativo centralizado (refs + computed)
│   ├── storage.js                # Abstração do localStorage (load/save por domínio)
│   ├── utils.js                  # Helpers puros: uuid, formatDate, getTitle, getPreview, blockHash
│   ├── components/
│   │   ├── toast.js              # Notificação temporária (showToast)
│   │   └── popover.js            # Menu contextual de seleção de texto
│   └── features/
│       ├── folders.js            # CRUD de pastas, rename inline
│       ├── notes.js              # CRUD de notas, busca, edição de conteúdo
│       ├── markdown.js           # Computed de renderização Markdown + code blocks
│       ├── settings.js           # Tema, fonte, toggleMode
│       ├── fillable.js           # Campos preenchíveis em blocos de código
│       ├── bookmarks.js          # Atalhos de texto (criar, navegar, remover)
│       ├── importExport.js       # Import/export de projetos e notas
│       └── shortcuts.js          # Atalhos de teclado (Ctrl+P, Ctrl+N)
└── ARCHITECTURE.md               # Este arquivo
```

## Fluxo de Dados

```
localStorage ←→ storage.js ←→ state.js ←→ features/*.js
                                  ↑              ↓
                              app.js (orquestra)
                                  ↓
                            template Vue (index.html)
```

1. **Inicialização**: `storage.js` carrega dados do `localStorage` → `state.js` cria refs reativas
2. **Interação do usuário**: Template Vue chama funções de features → features modificam refs em `state.js`
3. **Persistência**: Features chamam `persist()` (state.js) ou funções específicas de `storage.js`
4. **Reatividade**: Vue detecta mudanças nos refs → re-renderiza template automaticamente

## Mapa do localStorage

| Key | Tipo | Descrição |
|-----|------|-----------|
| `mdv_files` | `Array<{id, name, content, folder, createdAt, updatedAt}>` | Todas as notas |
| `mdv_folders` | `Array<{id, name}>` | Pastas do usuário |
| `mdv_settings` | `{dark, fontSize, fontFamily}` | Preferências visuais |
| `mdv_fillable` | `Array<{id, text, fileId, blockHash, value, createdAt}>` | Campos preenchíveis |
| `mdv_bookmarks` | `Array<{id, fileId, label, anchor, createdAt}>` | Atalhos de texto |

## Dependências entre Módulos

```
utils.js          → (nenhuma)
storage.js        → (nenhuma)
state.js          → storage.js, utils.js
toast.js          → state.js, utils.js
popover.js        → state.js, toast.js, utils.js
folders.js        → state.js, utils.js
notes.js          → state.js, storage.js, utils.js
markdown.js       → state.js, utils.js, toast.js
settings.js       → state.js, storage.js, utils.js
fillable.js       → state.js, storage.js, utils.js, toast.js
bookmarks.js      → state.js, storage.js, utils.js, toast.js
importExport.js   → state.js, utils.js, toast.js
shortcuts.js      → state.js, settings.js, notes.js
app.js            → TODOS os módulos acima
```

**Não há dependências circulares.** O fluxo é sempre: `utils/storage` ← `state` ← `components` ← `features` ← `app`.

## Como Adicionar uma Nova Feature

1. Crie `js/features/minhaFeature.js`
2. Adicione o comentário no topo: `// Responsabilidade: [descrição]`
3. Importe o estado necessário de `state.js`
4. Se precisar de persistência, use funções de `storage.js` (adicione novas se necessário)
5. Se precisar de novo estado reativo, adicione refs em `state.js` e exporte-os
6. Exporte suas funções com named exports (`export function`)
7. Em `app.js`:
   - Importe as funções/computeds da feature
   - Adicione ao objeto `return` do `setup()` se o template precisar acessá-las
   - Adicione watchers se necessário
8. No template (`index.html`), use as novas bindings

**Exemplo prático — adicionar tags nas notas:**
```
1. storage.js  → adicionar loadTags() / saveTags()
2. state.js    → adicionar ref tags + computed relevante
3. features/tags.js → lógica de CRUD de tags
4. app.js      → importar e retornar no setup()
5. index.html  → adicionar UI no template
6. components.css → estilos dos chips de tag
```

## Como Adicionar um Novo Componente Visual

1. Crie `js/components/meuComponente.js`
2. Componentes são elementos de UI reutilizáveis (toast, popover, etc.)
3. Importe estado de `state.js` se necessário
4. Exporte funções de controle (show/hide/toggle)
5. Adicione estilos em `styles/components.css`
6. Em `app.js`, importe e retorne no `setup()`
7. No template, use as bindings

## Convenções

- **ES Modules nativos** — `import/export` sem bundler
- **Named exports** — evite `export default`
- **Comentário de responsabilidade** — todo arquivo JS começa com `// Responsabilidade: ...`
- **Estado centralizado** — toda ref reativa vive em `state.js`
- **localStorage abstrato** — apenas `storage.js` acessa `localStorage` diretamente
- **Sem dependências circulares** — features nunca importam de `app.js`
- **Globals** — `window.__copyCode` e `window.__openFillModal` são registrados em `app.js` para callbacks em HTML renderizado pelo marked

## Referência Rápida: Onde Mexer

| Quero... | Arquivo(s) |
|----------|-----------|
| Mudar cores/tema | `styles/base.css` (variáveis :root e .light) |
| Mudar layout de um componente | `styles/components.css` |
| Mudar responsividade | `styles/layout.css` |
| Adicionar estado global | `state.js` |
| Persistir dados novos | `storage.js` + feature que usa |
| Criar nova feature | `js/features/` + `app.js` |
| Criar componente visual | `js/components/` + `styles/components.css` + `app.js` |
| Mudar atalhos de teclado | `js/features/shortcuts.js` |
| Mudar renderização markdown | `js/features/markdown.js` |
| Ajustar import/export JSON | `js/features/importExport.js` |
