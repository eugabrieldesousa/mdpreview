// Responsabilidade: Entry point — inicialização, orquestração e montagem da aplicação Vue

const { createApp, watch, nextTick, onMounted, onUnmounted } = Vue;

// State
import {
  files, folders, isDark, fontSize, fontFamily,
  activeFolderId, activeFileId, activeFile, editMode,
  searchQuery, sidebarOpen, showSettings, isMobile,
  currentFolderName, filteredFiles, markdownBody,
  toast, popover, selectedText, renameNote,
  fillableFields, fillModal,
  bookmarksData, showBookmarks,
  collapsedSections, sidebarCollapsed, notesListCollapsed,
  hasUnsavedChanges, ghToken, ghOwner, ghRepo, ghConnected,
  ghScreen, ghRepos, ghLoading, ghSaving, ghError,
  getFolderName, onResize
} from './state.js';

// Utils
import { getTitle, getPreview, formatDate, refreshIcons } from './utils.js';

// Components
import { showToast } from './components/toast.js';
import { onTextSelect, hidePopover, copySelection, quoteSelection, onDocClick } from './components/popover.js';

// Features
import { createFolder, selectFolder, filesByFolder, toggleSection } from './features/folders.js';
import { createFile, openFile, deleteFile, onContentChange, saveActiveFile, startRenameNote, confirmRenameNote } from './features/notes.js';
import { renderedMarkdown, copyCode } from './features/markdown.js';
import { toggleTheme, changeFontSize, saveFontFamily, toggleMode, applyTheme, applyFont } from './features/settings.js';
import { addFillableFromSelection, applyFillButtons, openFillModal, removeFillField, copyFilledCode } from './features/fillable.js';
import { currentFileBookmarks, addBookmarkFromSelection, removeBookmark, navigateToBookmark, applyBookmarkIndicators } from './features/bookmarks.js';
import { exportSingle } from './features/importExport.js';
import { onKeydown } from './features/shortcuts.js';
import { onInlineEdit } from './features/inlineEdit.js';
import { ghConnect, ghDisconnect, ghSelectRepo, ghChangeRepo, ghAutoConnect } from './features/github.js';

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
      ghAutoConnect();
      window.addEventListener('resize', onResize);
      window.addEventListener('keydown', onKeydown);
      document.addEventListener('click', onDocClick);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeydown);
      document.removeEventListener('click', onDocClick);
    });

    // Re-apply fill buttons and bookmark indicators after markdown render (preview mode)
    watch([renderedMarkdown, editMode], () => {
      if (!editMode.value) {
        nextTick(() => {
          applyFillButtons();
          applyBookmarkIndicators();
        });
      }
    });

    // Refresh icons after reactivity settles
    watch([
      activeFileId, editMode, activeFolderId, showSettings,
      () => fillModal.value.visible,
      () => toast.value.visible,
      () => showBookmarks.value,
      ghScreen,
      collapsedSections,
      sidebarCollapsed, notesListCollapsed
    ], () => {
      nextTick(refreshIcons);
    });

    // Auto-save when leaving edit mode
    watch(editMode, (newVal, oldVal) => {
      if (oldVal === true && newVal === false && hasUnsavedChanges.value) {
        saveActiveFile();
      }
    });

    return {
      // State
      files, folders, isDark, fontSize, fontFamily,
      activeFolderId, activeFileId, activeFile, editMode,
      searchQuery, sidebarOpen, showSettings, isMobile,
      currentFolderName, filteredFiles, renderedMarkdown,
      markdownBody,
      toast, popover, selectedText, renameNote,
      fillableFields, fillModal,
      bookmarksData, showBookmarks, currentFileBookmarks,
      collapsedSections, sidebarCollapsed, notesListCollapsed,
      hasUnsavedChanges,
      // GitHub
      ghToken, ghOwner, ghRepo, ghConnected,
      ghScreen, ghRepos, ghLoading, ghSaving, ghError,
      // Methods
      toggleTheme, changeFontSize, saveFontFamily, toggleMode,
      createFolder, selectFolder, filesByFolder, toggleSection,
      createFile, openFile, deleteFile, onContentChange, saveActiveFile,
      getTitle, getPreview, formatDate, getFolderName,
      onTextSelect, hidePopover, copySelection, quoteSelection,
      addFillableFromSelection, removeFillField, copyFilledCode,
      addBookmarkFromSelection, removeBookmark, navigateToBookmark,
      exportSingle,
      startRenameNote, confirmRenameNote,
      onInlineEdit,
      ghConnect, ghDisconnect, ghSelectRepo, ghChangeRepo,
      showToast, refreshIcons
    };
  }
}).mount('#app');
