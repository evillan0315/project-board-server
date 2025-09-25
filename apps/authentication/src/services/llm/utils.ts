import { fetchWithAuth, API_BASE_URL, handleResponse } from '@/services/authService';

export const extractCodeFromMarkdown = (text: string) => {
  const match = text.match(/```(?:\w+)?\n([\s\S]*?)\n```/);
  return match?.[1]?.trim() || text.trim();
};

export const convertYamlToJson = async (
  yaml: string,
): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/utils/json-yaml/to-json?save=false`, {
      method: 'POST',
      body: JSON.stringify({ yaml }),
    });


    return handleResponse<any>(res);
  } catch (error) {
    console.error('Error generating code:', error);
    throw error;
  }
};


