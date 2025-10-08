import { API_BASE_URL, ApiError, handleResponse, fetchWithAuth } from '@/api';
import {
  ApiFileScanResult,
  FileTreeNode,
  FileOperationResult, // Import new type
  RenameResult, // Import new type
  CopyResult, // Import new type
  MoveResult, // Import new type
} from '@/types'; // Import new FileTreeNode

export const fetchScannedFilesForAI = async (
  projectRoot: string,
  scanPaths: string[],
): Promise<ApiFileScanResult[]> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/file/list?directory=${projectRoot}&recursive=false`,
      {
        method: 'POST',
        body: JSON.stringify({
          scanPaths: scanPaths,
          projectRoot: projectRoot,
          verbose: false,
        }),
      },
    );
    return handleResponse<ApiFileScanResult[]>(response);
  } catch (error) {
    console.error('Error fetching project files for AI scan:', error);
    throw error;
  }
};

/**
 * Fetches a list of files and folders in a given directory, non-recursively.
 * Returns an array of FileTreeNode for the direct children.
 */
export const fetchDirectoryContents = async (
  directoryPath: string,
): Promise<FileTreeNode[]> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/file/list?directory=${encodeURIComponent(directoryPath)}&recursive=false`,
      { method: 'GET' },
    );
    return handleResponse<FileTreeNode[]>(response);
  } catch (error) {
    console.error(
      `Error fetching directory contents for ${directoryPath}:`,
      error,
    );
    throw error;
  }
};

export const readFileContent = async (filePath: string): Promise<string> => {
  try {
    // Ensure the filePath is sent in the body for the POST request
    const response = await fetchWithAuth(`${API_BASE_URL}/file/read`, {
      method: 'POST',
      body: JSON.stringify({ filePath: filePath }),
    });
    const data = await handleResponse<{ filePath: string; content: string }>(
      response,
    );

    return data.content;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
};

/**
 * Writes (updates) the content of a file at the specified path.
 * @param filePath The absolute or relative path to the file.
 * @param content The new content to write to the file.
 * @returns A promise that resolves to indicate success.
 */
export const writeFileContent = async (
  filePath: string,
  content: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/file/write`, {
      method: 'POST',
      body: JSON.stringify({ filePath, content }),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    throw error;
  }
};

/**
 * Creates a new file or folder.
 * @param filePath The full path for the new file/folder.
 * @param isDirectory Whether to create a directory or a file.
 * @param content Optional content for a new file.
 * @returns A promise that resolves to indicate success.
 */
export const createFileOrFolder = async (
  filePath: string,
  isDirectory: boolean,
  content?: string,
): Promise<{ success: boolean; filePath: string }> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/file/create`, {
      method: 'POST',
      body: JSON.stringify({ filePath, isDirectory, content }),
    });
    return handleResponse<{ success: boolean; filePath: string }>(response);
  } catch (error) {
    console.error(
      `Error creating ${isDirectory ? 'folder' : 'file'} at ${filePath}:`,
      error,
    );
    throw error;
  }
};

/**
 * Deletes a file or folder.
 * @param filePath The absolute path of the file or folder to delete.
 * @returns A promise with the operation result.
 */
export const deleteFile = async (
  filePath: string,
): Promise<FileOperationResult> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/file/delete`, {
      method: 'POST',
      body: JSON.stringify({ filePath }),
    });
    return handleResponse<FileOperationResult>(response);
  } catch (error) {
    console.error(`Error deleting ${filePath}:`, error);
    throw error;
  }
};

/**
 * Renames a file or folder.
 * @param oldPath The absolute path of the file or folder to rename.
 * @param newPath The new absolute path (including new name) for the file or folder.
 * @returns A promise with the operation result.
 */
export const renameFile = async (
  oldPath: string,
  newPath: string,
): Promise<RenameResult> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/file/rename`, {
      method: 'POST',
      body: JSON.stringify({ oldPath, newPath }),
    });
    return handleResponse<RenameResult>(response);
  } catch (error) {
    console.error(`Error renaming ${oldPath} to ${newPath}:`, error);
    throw error;
  }
};

/**
 * Copies a file or folder.
 * @param sourcePath The absolute path of the file or folder to copy.
 * @param destinationPath The absolute path for the copy destination.
 * @returns A promise with the operation result.
 */
export const copyFile = async (
  sourcePath: string,
  destinationPath: string,
): Promise<CopyResult> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/file/copy`, {
      method: 'POST',
      body: JSON.stringify({ sourcePath, destinationPath }),
    });
    return handleResponse<CopyResult>(response);
  } catch (error) {
    console.error(`Error copying ${sourcePath} to ${destinationPath}:`, error);
    throw error;
  }
};

/**
 * Moves a file or folder.
 * @param sourcePath The absolute path of the file or folder to move.
 * @param destinationPath The new absolute path for the item.
 * @returns A promise with the operation result.
 */
export const moveFile = async (
  sourcePath: string,
  destinationPath: string,
): Promise<MoveResult> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/file/move`, {
      method: 'POST',
      body: JSON.stringify({ sourcePath, destinationPath }),
    });
    return handleResponse<MoveResult>(response);
  } catch (error) {
    console.error(`Error moving ${sourcePath} to ${destinationPath}:`, error);
    throw error;
  }
};

// Add more file-related API calls as needed, e.g., create, update, delete, apply diffs
