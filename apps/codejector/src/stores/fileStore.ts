import { map } from 'nanostores';
import { writeFileContent, readFileContent } from '@/api/file';
import { addLog } from './logStore';
import { persistentAtom } from '@/utils/persistentAtom';
import { projectStore } from '@/stores/projectStore'; // New import

export interface FileStoreState {
  uploadedFileData: string | null;
  uploadedFileMimeType: string | null;
  uploadedFileName: string | null;
  initialFileContentSnapshot: string | null;
  isFetchingFileContent: boolean;
  fetchFileContentError: string | null;
  isSavingFileContent: boolean;
  saveFileContentError: string | null;
}

export const fileStore = map<FileStoreState>({
  uploadedFileData: null,
  uploadedFileMimeType: null,
  uploadedFileName: null,
  initialFileContentSnapshot: null,
  isFetchingFileContent: false,
  fetchFileContentError: null,
  isSavingFileContent: false,
  saveFileContentError: null,
});

// Persistent atoms for editor state that needs to survive reloads
export const openedFileContent = persistentAtom<string | null>(
  'openedFileContent',
  null,
);
export const openedFile = persistentAtom<string | null>('openedFile', null);
export const isOpenedFileDirty = persistentAtom<boolean>(
  'isOpenedFileDirty',
  false,
);
export const openedTabs = persistentAtom<string[]>('openedTabs', []);

// New: Atom for controlling the view mode of the currently opened file
export const openedFileViewMode = persistentAtom<'code' | 'preview'>(
  'openedFileViewMode',
  'code',
);

export const setOpenedFile = (filePath: string | null) => {
  openedFile.set(filePath);

  if (filePath && !openedTabs.get().includes(filePath)) {
    addOpenedTab(filePath);
  } else if (filePath) {
    addLog('File Editor', `Switched to file: ${filePath}`, 'info');
  } else {
    addLog('File Editor', 'No file is currently opened in the editor.', 'info');
  }

  // Clear transient states when changing file
  openedFileContent.set(null);
  isOpenedFileDirty.set(false);
  openedFileViewMode.set('code'); // Reset view mode to code when opening a new file
  fileStore.setKey('initialFileContentSnapshot', null);
  fileStore.setKey('isFetchingFileContent', false);
  fileStore.setKey('fetchFileContentError', null);
  fileStore.setKey('isSavingFileContent', false);
  fileStore.setKey('saveFileContentError', null);
};

export const setOpenedFileContent = (content: string | null) => {
  openedFileContent.set(content);
  fileStore.setKey('saveFileContentError', null); // Clear save error if content is being updated
  // Log a debug message, as this can be very frequent
  // addLog('File Editor', `Content updated for active file.`, 'debug');
};

export const setInitialFileContentSnapshot = (content: string | null) => {
  fileStore.setKey('initialFileContentSnapshot', content);
  //addLog('File Editor', `Initial content snapshot taken for active file.`, 'debug');
};

export const setIsFetchingFileContent = (isLoading: boolean) => {
  fileStore.setKey('isFetchingFileContent', isLoading);
  if (isLoading) {
    addLog('File Editor', `Fetching file content...`, 'debug');
  } else {
    //addLog('File Editor', `Finished fetching file content.`, 'debug');
  }
};

export const setFetchFileContentError = (message: string | null) => {
  fileStore.setKey('fetchFileContentError', message);
  if (message) {
    addLog(
      'File Editor',
      `Failed to fetch file content: ${message}`,
      'error',
      message,
      undefined,
      true,
    );
  }
};

export const setIsSavingFileContent = (isLoading: boolean) => {
  fileStore.setKey('isSavingFileContent', isLoading);
  if (isLoading) {
    addLog('File Editor', `Saving file content...`, 'info');
  } else {
    addLog('File Editor', `Finished saving file content.`, 'info');
  }
};

export const setSaveFileContentError = (message: string | null) => {
  fileStore.setKey('saveFileContentError', message);
  if (message) {
    addLog(
      'File Editor',
      `Failed to save file content: ${message}`,
      'error',
      message,
      undefined,
      true,
    );
  }
};

export const setIsOpenedFileDirty = (isDirty: boolean) => {
  isOpenedFileDirty.set(isDirty);
  if (isDirty) {
    addLog('File Editor', `Active file has unsaved changes.`, 'warning');
  }
};

export const addOpenedTab = (filePath: string) => {
  if (!openedTabs.get().includes(filePath)) {
    openedTabs.set([...openedTabs.get(), filePath]);
    addLog('File Editor', `Opened new tab for: ${filePath}`, 'info');
  }
};

export const removeOpenedTab = (filePath: string) => {
  const newOpenedTabs = openedTabs.get().filter((tab) => tab !== filePath);
  const currentOpenedFile = openedFile.get();
  openedTabs.set(newOpenedTabs);
  addLog('File Editor', `Closed tab for: ${filePath}`, 'info');

  if (currentOpenedFile === filePath) {
    if (newOpenedTabs.length > 0) {
      // Determine which tab to activate next (e.g., the one before, or the first one)
      const oldIndex = openedTabs.get().indexOf(filePath); // This will be -1 as it's already filtered, need to use prev state if we want accurate prev index
      const newActiveFile =
        oldIndex > 0 ? newOpenedTabs[oldIndex - 1] : newOpenedTabs[0];
      setOpenedFile(newActiveFile);
    } else {
      setOpenedFile(null);
    }
  }
};

export const saveActiveFile = async () => {
  const currentOpenedFile = openedFile.get();
  const fileContent = openedFileContent.get();
  const projectId = projectStore.get().currentProject?.id; // Retrieve projectId

  if (!currentOpenedFile || fileContent === null) {
    addLog(
      'File Editor',
      'Attempted to save, but no file or content available.',
      'warning',
      undefined,
      undefined,
      true,
    );
    return;
  }

  if (!projectId) {
    addLog(
      'File Editor',
      'No project selected. Cannot save file.',
      'error',
      undefined,
      undefined,
      true,
    );
    setSaveFileContentError('No project selected. Cannot save file.');
    return;
  }

  setIsSavingFileContent(true);
  setSaveFileContentError(null); // Clear previous error

  try {
    const result = await writeFileContent(
      currentOpenedFile,
      fileContent,
      projectId,
    ); // Pass projectId
    if (result.success) {
      setInitialFileContentSnapshot(fileContent);
      setIsOpenedFileDirty(false);
      addLog('File Editor', `File saved: ${currentOpenedFile}`, 'success');
    } else {
      const msg = result.message || 'Failed to save file.';
      setSaveFileContentError(msg);
      addLog(
        'File Editor',
        `Failed to save file: ${currentOpenedFile}`,
        'error',
        msg,
        undefined,
        true,
      );
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    setSaveFileContentError(`Failed to save file: ${errorMessage}`);
    addLog(
      'File Editor',
      `Error saving file: ${currentOpenedFile}`,
      'error',
      errorMessage,
      undefined,
      true,
    );
  } finally {
    setIsSavingFileContent(false);
  }
};

export const discardActiveFileChanges = () => {
  const { initialFileContentSnapshot } = fileStore.get(); // Still uses snapshot from fileStore
  const currentOpenedFile = openedFile.get();
  const isDirty = isOpenedFileDirty.get();

  if (!currentOpenedFile || !isDirty) {
    addLog(
      'File Editor',
      'Attempted to discard, but no unsaved changes.',
      'info',
    );
    return;
  }

  if (
    window.confirm(
      'Are you sure you want to discard unsaved changes? This action cannot be undone.',
    )
  ) {
    setOpenedFileContent(initialFileContentSnapshot);
    setIsOpenedFileDirty(false);
    setSaveFileContentError(null);
    addLog(
      'File Editor',
      `Changes discarded for: ${currentOpenedFile}`,
      'info',
    );
  }
};

export const fetchFileContent = async (filePath: string) => {
  const projectId = projectStore.get().currentProject?.id; // Retrieve projectId

  if (!projectId) {
    setFetchFileContentError('No project selected. Cannot fetch file content.');
    setIsFetchingFileContent(false);
    return;
  }

  setIsFetchingFileContent(true);
  setFetchFileContentError(null);

  try {
    const content = await readFileContent(filePath, projectId); // Pass projectId
    setOpenedFileContent(content);
    setInitialFileContentSnapshot(content);
    setIsOpenedFileDirty(false);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    setFetchFileContentError(errorMessage);
  } finally {
    setIsFetchingFileContent(false);
  }
};

export const setOpenedFileViewMode = (mode: 'code' | 'preview') => {
  openedFileViewMode.set(mode);
  addLog('File Editor', `Switched view mode to: ${mode}`, 'info');
};

// ────────────────────────────
// File upload
// ────────────────────────────
export const setUploadedFile = (
  data: string | null,
  mimeType: string | null,
  fileName: string | null,
) => {
  fileStore.setKey('uploadedFileData', data);
  fileStore.setKey('uploadedFileMimeType', mimeType);
  fileStore.setKey('uploadedFileName', fileName);
};
