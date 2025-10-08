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
