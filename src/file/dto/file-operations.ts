 // src/types/file-operations.ts

/**
 * Represents the result of a file operation.
 * Matches the backend's FileOperationResultDto.
 */
export interface FileOperationResultDto {
  /**
   * Indicates if the file operation was successful.
   */
  success: boolean;

  /**
   * A message describing the result of the operation.
   */
  message?: string;

  /**
   * The primary file path involved in the operation.
   */
  filePath?: string;

  /**
   * The old path, for rename/move operations.
   */
  oldPath?: string;

  /**
   * The new path, for rename/move operations.
   */
  newPath?: string;

  /**
   * Content of the file, for read operations.
   */
  content?: string;

  /**
   * Detected language, for read operations.
   */
  language?: string;

  /**
   * MIME type of the file, for read operations.
   */
  mimeType?: string;

  destinationPath?: string;
  sourcePath?: string;
}
