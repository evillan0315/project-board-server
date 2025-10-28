import { map } from 'nanostores';
import { FileTreeState, FileEntry } from '@/types/refactored/fileTree'; // Updated import
import { fetchDirectoryContents, fetchScannedFilesForAI } from '@/api/file';
import { socketService, isConnected } from '@/api/socket';
import { fileStore, setOpenedFile, setIsOpenedFileDirty } from './fileStore';
import { llmStore } from './llmStore';
import { getToken } from './authStore';
import { getRelativePath, persistentAtom } from '@/utils';

export const projectRootDirectoryStore = persistentAtom<string>(
  'projectRootDirectory',
  '/',
);
export const setCurrentProjectPath = (path: string) => {
  projectRootDirectoryStore.set(path);
};
export const fileTreeStore = map<FileTreeState>({
  files: [], // Hierarchical file tree
  flatFileList: [], // Flat list from API (for AI context)
  expandedDirs: new Set(), // Store expanded directories by their full path
  selectedFile: null,
  isFetchingTree: false,
  fetchTreeError: null,
  lastFetchedProjectRoot: null,
  lastFetchedScanPaths: [], // Retained for AI context scan paths, not directly for visual tree
  loadingChildren: new Set(), // Initialize new state for loading children
  projectRootDirectory: '/', // Added to align with FileTreeState
});

export const setFiles = (files: FileEntry[]) => {
  fileTreeStore.setKey('files', files);
};

export const toggleDirExpansion = async (dirPath: string) => {
  const state = fileTreeStore.get();
  const newExpandedDirs = new Set(state.expandedDirs);
  const isCurrentlyExpanded = newExpandedDirs.has(dirPath);

  if (isCurrentlyExpanded) {
    newExpandedDirs.delete(dirPath);
    fileTreeStore.set({ ...state, expandedDirs: newExpandedDirs });
  } else {
    newExpandedDirs.add(dirPath);
    fileTreeStore.set({ ...state, expandedDirs: newExpandedDirs });

    // If expanding and children are not loaded AND not already loading, fetch them
    const dirNode = findFileEntryInTree(state.files, dirPath);
    if (
      dirNode &&
      dirNode.type === 'folder' &&
      !dirNode.isChildrenLoaded &&
      !state.loadingChildren.has(dirPath)
    ) {
      await loadChildrenForDirectory(dirPath); // Await children loading
    }
  }
};

export const setSelectedFile = (filePath: string | null) => {
  const { isOpenedFileDirty } = fileStore.get();
  if (isOpenedFileDirty) {
    // Alert user about unsaved changes. If they cancel, don't change selection.
    const confirmDiscard = window.confirm(
      'You have unsaved changes in the current file. Do you want to discard them and open a new file?',
    );
    if (!confirmDiscard) {
      return; // Do not proceed with changing selected file
    }
    setIsOpenedFileDirty(false); // Reset dirty flag if user confirms discard
  }

  fileTreeStore.setKey('selectedFile', filePath);
  // When a file is selected in the tree, also set it in fileStore to display its content.
  // addOpenedTab is implicitly handled by setOpenedFile now
  setOpenedFile(filePath);
};

/**
 * Recursively finds and updates a FileEntry in the tree.
 * Used to insert children or update properties.
 */
const updateFileEntryInTree = (
  nodes: FileEntry[],
  targetPath: string,
  updateFn: (node: FileEntry) => FileEntry,
): FileEntry[] =>
  nodes.map((node) => {
    if (node.path === targetPath) {
      return updateFn(node);
    }
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        // Ensure node.children is correctly typed as FileEntry[] when passed recursively
        children: updateFileEntryInTree(node.children, targetPath, updateFn),
      };
    }
    return node;
  });

/**
 * Recursively finds a FileEntry in the tree.
 */
const findFileEntryInTree = (
  nodes: FileEntry[],
  targetPath: string,
): FileEntry | undefined => {
  for (const node of nodes) {
    if (node.path === targetPath) {
      return node;
    }
    if (node.children && node.children.length > 0) {
      // Ensure node.children is correctly typed as FileEntry[] when passed recursively
      const found = findFileEntryInTree(node.children, targetPath);
      if (found) return found;
    }
  }
  return undefined;
};

/**
 * Loads the initial tree for the project root. This should be called on project load/change.
 */
export const loadInitialTree = async (projectRoot: string) => {
  fileTreeStore.setKey('isFetchingTree', true);
  fileTreeStore.setKey('fetchTreeError', null);
  fileTreeStore.setKey('files', []); // Clear existing tree
  fileTreeStore.setKey('lastFetchedProjectRoot', projectRoot); // Set this immediately to indicate a fetch is in progress for this root

  try {
    if (!isConnected.get()) socketService.connect(getToken(), projectRoot);
    // Fetch top-level directories and files
    const apiNodes = await fetchDirectoryContents(projectRoot);
    //console.log(apiNodes, 'apiNodes');
    const initialTreeNodes: FileEntry[] = apiNodes.map((node) => ({
      ...node,
      depth: 0,
      collapsed: node.type === 'folder', // All new folders are collapsed by default
      relativePath: getRelativePath(node.path, projectRoot), // Calculate relative path
      children: [], // Initialize children as empty FileEntry[] for consistency
      isChildrenLoaded: node.type === 'file', // Files have no children to load, folders are not loaded yet
      isChildrenLoading: false, // Not currently loading children for this node
    }));

    // Sort folders first, then files
    initialTreeNodes.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });

    fileTreeStore.setKey('files', initialTreeNodes);

    // Additionally, fetch *all* relevant files for AI context using scan API
    // This uses llmStore.scanPathsInput
    /*const { scanPathsInput } = llmStore.get();
    const parsedScanPaths = scanPathsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const scannedFiles = await fetchScannedFilesForAI(
      projectRoot,
      parsedScanPaths,
    );
    fileTreeStore.setKey('flatFileList', scannedFiles); // This is now correctly typed as ApiFileScanResult[]
    fileTreeStore.setKey('lastFetchedScanPaths', parsedScanPaths);*/
  } catch (err) {
    console.error('Error loading initial tree or scanned files:', err);
    fileTreeStore.setKey(
      'fetchTreeError',
      `Failed to load project files: ${err instanceof Error ? err.message : String(err)}`,
    );
    fileTreeStore.setKey('files', []); // Ensure tree is empty on error
    fileTreeStore.setKey('flatFileList', []);
  } finally {
    fileTreeStore.setKey('isFetchingTree', false);
  }
};

/**
 * Loads children for a given directory path and updates the tree state.
 */
export const loadChildrenForDirectory = async (parentPath: string) => {
  if (!isConnected.get()) socketService.connect(getToken(), parentPath);
  const state = fileTreeStore.get();
  const newLoadingChildren = new Set(state.loadingChildren);

  // Prevent re-fetching if already fetching children for this path
  if (newLoadingChildren.has(parentPath)) {
    return;
  }

  // Find the parent node to determine its depth and ensure it's a folder
  const parentNode = findFileEntryInTree(state.files, parentPath);
  if (!parentNode || parentNode.type !== 'folder') {
    console.warn(
      `Attempted to load children for non-folder or non-existent path: ${parentPath}`,
    );
    return;
  }

  // Mark this specific folder as loading its children
  newLoadingChildren.add(parentPath);
  fileTreeStore.set({ ...state, loadingChildren: newLoadingChildren });
  // Also update the specific node in the tree to reflect its loading state
  const treeWithLoadingState = updateFileEntryInTree(
    state.files,
    parentPath,
    (node) => ({
      ...node,
      isChildrenLoading: true,
    }),
  );
  fileTreeStore.setKey('files', treeWithLoadingState);

  try {
    const childrenNodes = await fetchDirectoryContents(parentPath);

    const newChildren: FileEntry[] = childrenNodes.map((node) => ({
      ...node,
      depth: (parentNode.depth || 0) + 1,
      collapsed: node.type === 'folder',
      relativePath: getRelativePath(
        node.path,
        state.lastFetchedProjectRoot || '',
      ),
      children: [], // Initialize children as empty FileEntry[]
      isChildrenLoaded: node.type === 'file', // Files have no children, new folders are not loaded yet
      isChildrenLoading: false,
    }));

    const updatedTree = updateFileEntryInTree(
      state.files,
      parentPath,
      (node) => ({
        ...node,
        children: newChildren.sort((a, b) => {
          // Sort directories first, then files, alphabetically
          if (a.type === 'folder' && b.type !== 'folder') return -1;
          if (a.type !== 'folder' && b.type === 'folder') return 1;
          return a.name.localeCompare(b.name);
        }),
        isChildrenLoaded: true, // Mark children as loaded for this parent
        isChildrenLoading: false, // Done loading
      }),
    );
    fileTreeStore.setKey('files', updatedTree);
  } catch (err) {
    console.error(`Error loading children for directory ${parentPath}:`, err);
    fileTreeStore.setKey(
      'fetchTreeError',
      `Failed to load children for ${parentPath}: ${err instanceof Error ? err.message : String(err)}`,
    );
    // On error, mark node as not loaded but not loading either
    const treeWithErrorState = updateFileEntryInTree(
      fileTreeStore.get().files,
      parentPath,
      (node) => ({
        ...node,
        isChildrenLoaded: false, // Optionally reset if load failed
        isChildrenLoading: false,
      }),
    );
    fileTreeStore.setKey('files', treeWithErrorState);
  } finally {
    newLoadingChildren.delete(parentPath);
    fileTreeStore.setKey('loadingChildren', newLoadingChildren);
  }
};

export const clearFileTree = () => {
  fileTreeStore.set({
    files: [],
    flatFileList: [],
    expandedDirs: new Set(),
    selectedFile: null,
    isFetchingTree: false,
    fetchTreeError: null,
    lastFetchedProjectRoot: null,
    lastFetchedScanPaths: [],
    loadingChildren: new Set(),
    projectRootDirectory: projectRootDirectoryStore.get(), // <-- add this
  });
  // Also clear any opened file content in fileStore
  setOpenedFile(null);
};
