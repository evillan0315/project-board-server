import { AUTH_TOKEN_KEY } from '@/utils/persistentAtom';
import { IPlan, IPlanResponse, ILlmInputDto } from '@/types/planner';

const BASE_URL = import.meta.env.VITE_PLANNER_API_URL || 'http://localhost:5000/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

const fetchApi = async (endpoint: string, options: FetchOptions = {}) => {
  const token = options.token || localStorage.getItem(AUTH_TOKEN_KEY);
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorBody.message || `API Error: ${response.status}`);
  }

  return response.json();
};

export const projectPlannerService = {
  generatePlan: async (llmInput: ILlmInputDto, token?: string): Promise<IPlanResponse> => {
    return fetchApi('/plan', {
      method: 'POST',
      body: JSON.stringify(llmInput),
      token,
    });
  },

  getPlan: async (planId: string, token?: string): Promise<{ plan: IPlan }> => {
    return fetchApi(`/plan/${planId}`, {
      method: 'GET',
      token,
    });
  },

  getPlanChunks: async (planId: string, token?: string): Promise<{ chunks: string[] }> => {
    return fetchApi(`/plan/${planId}/chunks`, {
      method: 'GET',
      token,
    });
  },

  applyChunk: async (planId: string, chunkIndex: number, token?: string): Promise<any> => {
    return fetchApi(`/plan/${planId}/apply-chunk/${chunkIndex}`, {
      method: 'POST',
      token,
    });
  },

  applyPlan: async (plan: IPlan, token?: string): Promise<any> => {
    return fetchApi('/plan/apply', {
      method: 'POST',
      body: JSON.stringify({ plan }),
      token,
    });
  },
};
