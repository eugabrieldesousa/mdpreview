// Responsabilidade: Entry point — inicialização, orquestração e montagem da aplicação Vue

const { createApp, watch, nextTick, onMounted, onUnmounted } = Vue;

// State
import {
  files, folders, isDark, fontSize, fontFamily,
  activeFolderId, activeFileId, activeFile, editMode,
  searchQuery, sidebarOpen, showSettings, isMobile,
  currentFolderName, filteredFiles, markdownBody,
  renamingFolderId, renamingFolderName,
  toast, popover, selectedText, importConflict, renameNote,
  fillableFields, fillModal,
  bookmarksData, showBookmarks,
  collapsedSections, sidebarCollapsed, notesListCollapsed,
  persist, getFolderName, onResize
} from './state.js';

// Utils
import { getTitle, getPreview, formatDate, refreshIcons } from './utils.js';

// Components
import { showToast } from './components/toast.js';
import { onTextSelect, hidePopover, copySelection, quoteSelection, onDocClick } from './components/popover.js';

// Features
import { createFolder, selectFolder, startRenameFolder, confirmRenameFolder, cancelRenameFolder, deleteFolder, filesByFolder, toggleSection } from './features/folders.js';
import { createFile, openFile, deleteFile, onContentChange, startRenameNote, confirmRenameNote } from './features/notes.js';
import { renderedMarkdown, copyCode } from './features/markdown.js';
import { toggleTheme, changeFontSize, saveFontFamily, toggleMode, applyTheme, applyFont } from './features/settings.js';
import { addFillableFromSelection, applyFillButtons, openFillModal, removeFillField, copyFilledCode } from './features/fillable.js';
import { currentFileBookmarks, addBookmarkFromSelection, removeBookmark, navigateToBookmark } from './features/bookmarks.js';
import { exportProject, exportSingle, importProject, resolveImport } from './features/importExport.js';
import { onKeydown } from './features/shortcuts.js';
import { initTipTap, destroyTipTap, setupTipTapWatchers } from './features/tiptap.js';

// Global callbacks for rendered HTML (code blocks)
window.__copyCode = copyCode;
window.__openFillModal = openFillModal;

createApp({
  setup() {
    // --- Lifecycle ---
    onMounted(() => {
      applyTheme();
      applyFont();
      refreshIcons();
      window.addEventListener('resize', onResize);
      window.addEventListener('keydown', onKeydown);
      document.addEventListener('click', onDocClick);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeydown);
      document.removeEventListener('click', onDocClick);
    });

    // Setup TipTap watchers
    setupTipTapWatchers();

    // Re-apply fill buttons after markdown render (edit mode raw preview)
    watch([renderedMarkdown, editMode], () => {
      if (editMode.value) {
        nextTick(() => applyFillButtons());
      }
    });

    // Refresh icons after reactivity settles
    watch([
      activeFileId, editMode, activeFolderId, showSettings,
      () => fillModal.value.visible,
      () => importConflict.value.visible,
      () => toast.value.visible,
      () => showBookmarks.value,
      collapsedSections,
      sidebarCollapsed, notesListCollapsed
    ], () => {
      nextTick(refreshIcons);
    });

    return {
      // State
      files, folders, isDark, fontSize, fontFamily,
      activeFolderId, activeFileId, activeFile, editMode,
      searchQuery, sidebarOpen, showSettings, isMobile,
      currentFolderName, filteredFiles, renderedMarkdown,
      markdownBody,
      renamingFolderId, renamingFolderName,
      toast, popover, selectedText, importConflict, renameNote,
      fillableFields, fillModal,
      bookmarksData, showBookmarks, currentFileBookmarks,
      collapsedSections, sidebarCollapsed, notesListCollapsed,
      // Methods
      toggleTheme, changeFontSize, saveFontFamily, toggleMode,
      createFolder, selectFolder, startRenameFolder, confirmRenameFolder, cancelRenameFolder,
      deleteFolder, filesByFolder, toggleSection,
      createFile, openFile, deleteFile, onContentChange,
      getTitle, getPreview, formatDate, getFolderName,
      onTextSelect, hidePopover, copySelection, quoteSelection,
      addFillableFromSelection, removeFillField, copyFilledCode,
      addBookmarkFromSelection, removeBookmark, navigateToBookmark,
      exportProject, exportSingle, importProject, resolveImport,
      startRenameNote, confirmRenameNote,
      initTipTap, destroyTipTap,
      persist, showToast, refreshIcons
    };
  }
}).mount('#app');
