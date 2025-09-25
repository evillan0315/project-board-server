import { fetchWithAuth, API_BASE_URL, handleResponse } from '@/services/authService';
import {
  FileOperationResult,
  RenameResult,
  CopyResult,
  MoveResult,
  FileContentResponse
} from '@/types/file';

// --- Read file content ---
export const readFileContent = async (filePath: string): Promise<string> => {
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/file/read`, {
      method: 'POST',
      body: JSON.stringify({ filePath }),
    });
    const data = await handleResponse<FileContentResponse>(res);
    return data.content;
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    throw err;
  }
};

// --- Write / update file ---
export const writeFileContent = async (
  filePath: string,
  content: string,
): Promise<FileOperationResult> => {
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/file/write`, {
      method: 'POST',
      body: JSON.stringify({ filePath, content }),
    });
    return handleResponse<FileOperationResult>(res);
  } catch (err) {
    console.error(`Error writing file ${filePath}:`, err);
    throw err;
  }
};

// --- Create file or folder ---
export const createFileOrFolder = async (
  filePath: string,
  isDirectory: boolean,
  content?: string,
): Promise<FileOperationResult> => {
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/file/create`, {
      method: 'POST',
      body: JSON.stringify({ filePath, isDirectory, content }),
    });
    return handleResponse<FileOperationResult>(res);
  } catch (err) {
    console.error(`Error creating ${isDirectory ? 'folder' : 'file'} at ${filePath}:`, err);
    throw err;
  }
};

// --- Delete file or folder ---
export const deleteFile = async (filePath: string): Promise<FileOperationResult> => {
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/file/delete`, {
      method: 'POST',
      body: JSON.stringify({ filePath }),
    });
    return handleResponse<FileOperationResult>(res);
  } catch (err) {
    console.error(`Error deleting ${filePath}:`, err);
    throw err;
  }
};

// --- Rename file or folder ---
export const renameFile = async (oldPath: string, newPath: string): Promise<RenameResult> => {
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/file/rename`, {
      method: 'POST',
      body: JSON.stringify({ oldPath, newPath }),
    });
    return handleResponse<RenameResult>(res);
  } catch (err) {
    console.error(`Error renaming ${oldPath} -> ${newPath}:`, err);
    throw err;
  }
};

// --- Copy file or folder ---
export const copyFile = async (sourcePath: string, destinationPath: string): Promise<CopyResult> => {
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/file/copy`, {
      method: 'POST',
      body: JSON.stringify({ sourcePath, destinationPath }),
    });
    return handleResponse<CopyResult>(res);
  } catch (err) {
    console.error(`Error copying ${sourcePath} -> ${destinationPath}:`, err);
    throw err;
  }
};

// --- Move file or folder ---
export const moveFile = async (sourcePath: string, destinationPath: string): Promise<MoveResult> => {
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/file/move`, {
      method: 'POST',
      body: JSON.stringify({ sourcePath, destinationPath }),
    });
    return handleResponse<MoveResult>(res);
  } catch (err) {
    console.error(`Error moving ${sourcePath} -> ${destinationPath}:`, err);
    throw err;
  }
};
