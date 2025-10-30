import { IAuthUser } from '@/types/auth';
import { AUTH_TOKEN_KEY } from '@/utils/persistentAtom';

const BASE_URL = import.meta.env.VITE_PLANNER_API_URL || 'http://localhost:5000/api';

export const authService = {
  getMe: async (token: string): Promise<IAuthUser> => {
    const response = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: response.statusText }));
      localStorage.removeItem(AUTH_TOKEN_KEY);
      throw new Error(errorBody.message || `Failed to fetch user data: ${response.status}`);
    }

    return response.json();
  },
};
