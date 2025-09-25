import { fetchWithAuth, API_BASE_URL, handleResponse } from '@/services/authService';
import {
  FileTreeNode
} from '@/types/file';
// --- List directory contents ---
export const fetchDirectoryContents = async (
  directoryPath: string,
): Promise<FileTreeNode[]> => {
  try {
    const res = await fetchWithAuth(
      `${API_BASE_URL}/file/list?directory=${encodeURIComponent(
        directoryPath,
      )}&recursive=false`,
    );
    return handleResponse<FileTreeNode[]>(res);
  } catch (err) {
    console.error(`Error fetching directory contents for ${directoryPath}:`, err);
    throw err;
  }
};
