import { API_BASE_URL, ApiError, handleResponse, fetchWithAuth } from '@/api';

export const getGitStatus = async () => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/status`, {
      method: 'GET',
    });
    return response;
  } catch (error) {
    console.error('Error fetching git status:', error);
    throw error;
  }
};

export const gitCommit = async (message: string) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/commit`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    return response;
  } catch (error) {
    console.error('Error creating commit', error);
    throw error;
  }
};

export const gitCreateBranch = async (branchName: string) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/git/branch`, {
      method: 'POST',
      body: JSON.stringify({ branchName }),
    });
    return response;
  } catch (error) {
    console.error('Error creating branch', error);
    throw error;
  }
};
