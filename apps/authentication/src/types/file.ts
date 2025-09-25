import { type FileTreeType } from '@/constants/types';

/**
 * Represents a file or folder entry returned by the backend's /api/file/list (non-recursive) endpoint.
 * This interface mirrors the backend's FileTreeNode directly.
 */
export interface FileTreeNode {
  name: string;
  path: string; // Absolute path to the file or folder
  isDirectory: boolean;
  type: FileTreeType;
  lang?: string;
  mimeType?: string;
  size?: number;
  createdAt?: Date;
  updatedAt?: Date;
  children: FileTreeNode[]; // Will be empty when recursive=false is used.
}
/**
 * Represents a file or folder entry in the frontend's interactive file tree.
 * Extends FileTreeNode from the backend to include UI-specific state.
 */
export interface FileEntry extends FileTreeNode {
  collapsed: boolean; // Frontend-specific: true if folder is collapsed, false if expanded
  depth: number; // Frontend-specific: depth in the tree hierarchy for indentation
  children?: FileTreeNode[];
  collapsed?: boolean;
  isChildrenLoaded: boolean; // New: Tracks if children for this folder have been explicitly fetched
  isChildrenLoading: boolean; // New: Tracks if children for this specific folder are currently being fetched
}

export interface FileTreeState {
  files: FileEntry[]; // Top-level directories/files (after initial load, then updated hierarchically)
  flatFileList: ApiFileScanResult[]; // Flat list of *all* files from API for AI context
  expandedDirs: Set<string>; // Set of absolute filePaths of expanded directories
  selectedFile: string | null; // Absolute filePath of the currently selected file
  isFetchingTree: boolean;
  fetchTreeError: string | null;
  lastFetchedProjectRoot?: string | null; // Tracks the project root for the last successful initial fetch
  lastFetchedScanPaths?: string[]; // Tracks the scan paths for the last successful AI context fetch
  loadingChildren: Set<string>;
  projectRootDirectory: string;
}

/**
 * Represents a file entry returned by the backend's /api/file/scan endpoint.
 * This is used for providing AI context and is a flat structure.
 */
export interface ApiFileScanResult {
  filePath: string;
  type: FileTreeType;
  size?: number; // Optional because directories won't have size
  lastModified?: number; // Optional for the same reason
}

// =========================================================================
// File Operation Types
// =========================================================================

// API Results for file operations
export interface FileOperationResult {
  success: boolean;
  message: string;
  filePath?: string; // Path of the file involved in the operation
  error?: string;
}

export interface RenameResult extends FileOperationResult {
  oldPath?: string;
  newPath?: string;
}

export interface CopyResult extends FileOperationResult {
  sourcePath?: string;
  destinationPath?: string;
}

export interface MoveResult extends FileOperationResult {
  sourcePath?: string;
  destinationPath?: string;
}

export interface FileContentResponse {
  content: string;
  filePath: string;
}
