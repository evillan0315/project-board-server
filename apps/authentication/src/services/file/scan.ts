import { fetchWithAuth, API_BASE_URL, handleResponse } from '@/services/authService';
import {
  ApiFileScanResult
} from '@/types/file';

export const fetchScannedFilesForAI = async (
  projectRoot: string,
  scanPaths: string[],
): Promise<ApiFileScanResult[]> => {
  const res = await fetchWithAuth(`${API_BASE_URL}/file/scan`, {
    method: 'POST',
    body: JSON.stringify({ projectRoot, scanPaths, verbose: false }),
  });
  return handleResponse<ApiFileScanResult[]>(res);
};

