// Responsabilidade: Integração TipTap — editor WYSIWYG com suporte a Markdown

import { activeFile, activeFileId, editMode, hasUnsavedChanges } from '../state.js';

const { watch, nextTick } = Vue;

let editorInstance = null;
let tiptapModules = null;
let skipUpdate = false;

async function loadTipTapModules() {
  if (tiptapModules) return tiptapModules;
  const [core, starterKit, mdExt] = await Promise.all([
    import('https://esm.sh/@tiptap/core@2'),
    import('https://esm.sh/@tiptap/starter-kit@2'),
    import('https://esm.sh/tiptap-markdown@0.8'),
  ]);
  tiptapModules = {
    Editor: core.Editor,
    StarterKit: starterKit.default || starterKit.StarterKit,
    Markdown: mdExt.Markdown,
  };
  return tiptapModules;
}

function getEditorElement() {
  return document.getElementById('tiptap-editor');
}

export async function initTipTap() {
  await destroyTipTap();
  if (!activeFile.value || editMode.value) return;
  const el = getEditorElement();
  if (!el) return;
  const { Editor, StarterKit, Markdown } = await loadTipTapModules();
  editorInstance = new Editor({
    element: el,
    extensions: [
      StarterKit,
      Markdown.configure({
        html: true,
        breaks: true,
        tightLists: true,
        transformPastedText: true,
      }),
    ],
    content: activeFile.value.content || '',
    editorProps: {
      attributes: { class: 'tiptap-content' },
    },
    onUpdate: ({ editor }) => {
      if (skipUpdate || !activeFile.value) return;
      const md = editor.storage.markdown.getMarkdown();
      activeFile.value.content = md;
      hasUnsavedChanges.value = true;
    },
  });
}

export async function destroyTipTap() {
  if (editorInstance) {
    editorInstance.destroy();
    editorInstance = null;
  }
}

export function getTipTapInstance() {
  return editorInstance;
}

export function syncContentToTipTap() {
  if (!editorInstance || !activeFile.value) return;
  skipUpdate = true;
  editorInstance.commands.setContent(activeFile.value.content || '');
  skipUpdate = false;
}

export function setupTipTapWatchers() {
  watch(activeFileId, async () => {
    if (!editMode.value) {
      await nextTick();
      await initTipTap();
    }
  });

  watch(editMode, async (isEdit) => {
    if (!isEdit) {
      await nextTick();
      await initTipTap();
    } else {
      await destroyTipTap();
    }
  });
}
