/**
 * Represents a file or folder entry returned by the backend's /api/file/list (non-recursive) endpoint.
 * This interface mirrors the backend's FileTreeNode directly.
 */
export interface FileTreeNode {
  name: string;
  path: string; // Absolute path to the file or folder
  isDirectory: boolean;
  type: 'file' | 'folder';
  lang?: string;
  mimeType?: string;
  size?: number;
  createdAt?: Date;
  updatedAt?: Date;
  /**
   * Children are only populated if the backend call is recursive.
   * When non-recursive, this may be undefined.
   */
  children?: FileTreeNode[];
}

/**
 * Represents a file or folder entry in the frontend's interactive file tree.
 * Extends FileTreeNode from the backend to include UI-specific state.
 */
export interface FileEntry extends FileTreeNode {
  /** Frontend-specific: true if folder is collapsed, false if expanded */
  collapsed: boolean;
  /** Frontend-specific: depth in the tree hierarchy for indentation */
  depth: number;
  /** Children entries after conversion to FileEntry format */
  children?: FileEntry[];
  /** Optional relative path from project root if needed by frontend utilities */
  relativePath?: string;
  /** Tracks if children for this folder have been explicitly fetched */
  isChildrenLoaded: boolean;
  /** Tracks if children for this specific folder are currently being fetched */
  isChildrenLoading: boolean;
}

export interface FileTreeState {
  files: FileEntry[];
  flatFileList: ApiFileScanResult[];
  expandedDirs: Set<string>;
  selectedFile: string | null;
  isFetchingTree: boolean;
  fetchTreeError: string | null;
  lastFetchedProjectRoot?: string | null;
  lastFetchedScanPaths?: string[];
  loadingChildren: Set<string>;
  projectRootDirectory: string;
}

/**
 * Represents a file entry returned by the backend's /api/file/scan endpoint.
 * This is used for providing AI context and is a flat structure.
 */
export interface ApiFileScanResult {
  filePath: string;
  type: 'file' | 'folder';
  size?: number;
  lastModified?: number;
}
