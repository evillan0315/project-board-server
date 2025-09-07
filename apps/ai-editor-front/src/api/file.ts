import { getToken } from '@/stores/authStore';
import { FileEntry } from '@/types';

const API_BASE_URL = `/api`;

interface ApiError extends Error {
  statusCode?: number;
  message: string;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || `API error: ${response.status}`);
  }
  return response.json();
};

const fetchWithAuth = async (url: string, options?: RequestInit) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  return fetch(url, { ...options, headers });
};

export const fetchProjectFiles = async (
  projectRoot: string,
  scanPaths: string[],
): Promise<FileEntry[]> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/file/scan`, {
      method: 'POST',
      body: JSON.stringify({
        scanPaths: scanPaths,
        projectRoot: projectRoot,
        verbose: false,
      }),
    });
    return handleResponse<FileEntry[]>(response);
  } catch (error) {
    console.error('Error fetching project files:', error);
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
    const data = await handleResponse<FileContentResponse>(response);
    return data.content;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
};

// Add more file-related API calls as needed, e.g., create, update, delete, apply diffs
