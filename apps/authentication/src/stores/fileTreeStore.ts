import { map, derived } from 'nanostores';
import { FileTreeState, FileEntry, ApiFileScanResult } from '@/types/file';
import { fetchDirectoryContents, fetchScannedFilesForAI } from '@/services/file';
import { getRelativePath, persistentAtom } from '@/utils';

// --- Persistent Project Root ---
export const projectRootDirectoryStore = persistentAtom<string>('projectRootDirectory', '/');

// --- File Tree Store ---
export const fileTreeStore = map<FileTreeState>({
  files: [],
  expandedDirs: new Set(),
  selectedFile: null,
  isFetchingTree: false,
  fetchTreeError: null,
  lastFetchedProjectRoot: null,
  lastFetchedScanPaths: [],
  loadingChildren: new Set(),
});

// --- Derived Stores ---

// Flattened file tree for autocomplete, AI scanning, etc.
export const flatFileListStore = derived(fileTreeStore, $tree => {
  const result: ApiFileScanResult[] = [];
  const traverse = (nodes: FileEntry[]) => {
    for (const node of nodes) {
      if (node.type === 'file') result.push({ filePath: node.path });
      if (node.children?.length) traverse(node.children);
    }
  };
  traverse($tree.files);
  return result;
});

// Extract only expanded directories as array
export const expandedDirsStore = derived(fileTreeStore, $tree => Array.from($tree.expandedDirs));

// Selected file store
export const selectedFileStore = derived(fileTreeStore, $tree => $tree.selectedFile);

// Loading children directories as array
export const loadingChildrenStore = derived(fileTreeStore, $tree => Array.from($tree.loadingChildren));

// --- Actions ---

export const setFiles = (files: FileEntry[]) => fileTreeStore.setKey('files', files);

export const setSelectedFile = (filePath: string | null) => {
  fileTreeStore.setKey('selectedFile', filePath);
};

export const toggleDirExpansion = async (dirPath: string) => {
  const state = fileTreeStore.get();
  const expandedDirs = new Set(state.expandedDirs);
  const isExpanded = expandedDirs.has(dirPath);

  isExpanded ? expandedDirs.delete(dirPath) : expandedDirs.add(dirPath);
  fileTreeStore.set({ ...state, expandedDirs });

  const node = findFileEntryInTree(state.files, dirPath);
  if (node?.type === 'folder' && !node.isChildrenLoaded && !state.loadingChildren.has(dirPath)) {
    await loadChildrenForDirectory(dirPath);
  }
};

// --- Recursive Helpers ---
const updateFileEntryInTree = (
  nodes: FileEntry[],
  targetPath: string,
  updateFn: (node: FileEntry) => FileEntry,
): FileEntry[] =>
  nodes.map(node =>
    node.path === targetPath
      ? updateFn(node)
      : { ...node, children: node.children ? updateFileEntryInTree(node.children, targetPath, updateFn) : [] },
  );

const findFileEntryInTree = (nodes: FileEntry[], targetPath: string): FileEntry | undefined => {
  for (const node of nodes) {
    if (node.path === targetPath) return node;
    if (node.children?.length) {
      const found = findFileEntryInTree(node.children, targetPath);
      if (found) return found;
    }
  }
};

// --- Load Initial Tree ---
export const loadInitialTree = async (projectRoot: string, scanPaths: string[] = []) => {
  fileTreeStore.set({
    ...fileTreeStore.get(),
    isFetchingTree: true,
    fetchTreeError: null,
    files: [],
    lastFetchedProjectRoot: projectRoot,
  });

  try {
    const apiNodes = await fetchDirectoryContents(projectRoot);
    const files: FileEntry[] = apiNodes.map(node => ({
      ...node,
      depth: 0,
      collapsed: node.type === 'folder',
      relativePath: getRelativePath(node.path, projectRoot),
      children: [],
      isChildrenLoaded: node.type === 'file',
      isChildrenLoading: false,
    })).sort((a, b) =>
      a.type === 'folder' && b.type !== 'folder' ? -1 :
      b.type === 'folder' && a.type !== 'folder' ? 1 :
      a.name.localeCompare(b.name)
    );

    fileTreeStore.setKey('files', files);

    if (scanPaths.length > 0) {
      const flatFileList: ApiFileScanResult[] = await fetchScannedFilesForAI(projectRoot, scanPaths);
      // Derived store flatFileListStore will automatically reflect this
      fileTreeStore.setKey('lastFetchedScanPaths', scanPaths);
      // Optional: store scanned results in a separate key for caching
      fileTreeStore.setKey('scannedFilesCache', flatFileList);
    }
  } catch (err) {
    console.error('Error loading tree:', err);
    fileTreeStore.set({
      ...fileTreeStore.get(),
      fetchTreeError: `Failed to load project files: ${err instanceof Error ? err.message : String(err)}`,
      files: [],
    });
  } finally {
    fileTreeStore.setKey('isFetchingTree', false);
  }
};

// --- Load Directory Children ---
export const loadChildrenForDirectory = async (parentPath: string) => {
  const state = fileTreeStore.get();
  const loadingChildren = new Set(state.loadingChildren);
  if (loadingChildren.has(parentPath)) return;

  const parentNode = findFileEntryInTree(state.files, parentPath);
  if (!parentNode || parentNode.type !== 'folder') return;

  loadingChildren.add(parentPath);
  fileTreeStore.set({ ...state, loadingChildren });
  fileTreeStore.setKey('files', updateFileEntryInTree(state.files, parentPath, node => ({ ...node, isChildrenLoading: true })));

  try {
    const childrenNodes = await fetchDirectoryContents(parentPath);
    const children: FileEntry[] = childrenNodes.map(node => ({
      ...node,
      depth: (parentNode.depth || 0) + 1,
      collapsed: node.type === 'folder',
      relativePath: getRelativePath(node.path, state.lastFetchedProjectRoot || ''),
      children: [],
      isChildrenLoaded: node.type === 'file',
      isChildrenLoading: false,
    })).sort((a, b) =>
      a.type === 'folder' && b.type !== 'folder' ? -1 :
      b.type === 'folder' && a.type !== 'folder' ? 1 :
      a.name.localeCompare(b.name)
    );

    fileTreeStore.setKey('files', updateFileEntryInTree(state.files, parentPath, node => ({
      ...node,
      children,
      isChildrenLoaded: true,
      isChildrenLoading: false,
    })));
  } catch (err) {
    console.error(`Error loading children for ${parentPath}:`, err);
    fileTreeStore.setKey('fetchTreeError', `Failed to load children for ${parentPath}: ${err instanceof Error ? err.message : String(err)}`);
    fileTreeStore.setKey('files', updateFileEntryInTree(fileTreeStore.get().files, parentPath, node => ({
      ...node,
      isChildrenLoaded: false,
      isChildrenLoading: false,
    })));
  } finally {
    loadingChildren.delete(parentPath);
    fileTreeStore.setKey('loadingChildren', loadingChildren);
  }
};

// --- Clear File Tree ---
export const clearFileTree = () => {
  fileTreeStore.set({
    files: [],
    expandedDirs: new Set(),
    selectedFile: null,
    isFetchingTree: false,
    fetchTreeError: null,
    lastFetchedProjectRoot: null,
    lastFetchedScanPaths: [],
    loadingChildren: new Set(),
  });
};

