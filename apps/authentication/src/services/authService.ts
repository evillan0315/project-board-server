// src/services/authService.ts
import { getToken, loginSuccess, logout, setLoading, setError } from '@/stores/authStore';
import { UserProfile, LoginRequest, RegisterRequest } from '@/types/auth';

export const API_BASE_URL = '/api';

/**
 * Generic fetch wrapper with auth token.
 */
export const fetchWithAuth = async (url: string, options?: RequestInit) => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options?.headers,
  };
  return fetch(url, { ...options, headers });
};

/**
 * Handles API response, throwing if status not OK.
 */
export const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.message || `API error: ${res.status}`);
  }
  return res.json();
};

/**
 * Logs out the user and clears local auth state.
 */
export const handleLogout = async (): Promise<void> => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData?.message || 'Logout failed');
    }
    logout();
  } catch (err: unknown) {
    setError(err instanceof Error ? err.message : 'Unknown logout error');
  } finally {
    setLoading(false);
  }
};

/**
 * Checks current authentication status and updates the auth store.
 */
export const checkAuthStatus = async (): Promise<void> => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`);
    if (response.ok) {
      const user: UserProfile | null = await response.json();
      user?.id ? loginSuccess(user) : logout();
    } else {
      logout();
    }
  } catch (err: unknown) {
    console.error('Auth status check failed:', err);
    setError('Failed to check authentication status.');
    logout();
  } finally {
    setLoading(false);
  }
};

/**
 * Performs local email/password login.
 */
export const loginLocal = async (credentials: LoginRequest) => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.message || 'Login failed');

    const user: UserProfile = { ...data.user, provider: 'local' };
    loginSuccess(user, data.access_token);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown login error';
    setError(message);
    return { success: false, message };
  } finally {
    setLoading(false);
  }
};

/**
 * Performs local email/password registration.
 */
export const registerLocal = async (userData: RegisterRequest) => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.message || 'Registration failed');

    const user: UserProfile = { ...data.user, provider: 'local' };
    loginSuccess(user, data.access_token);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown registration error';
    setError(message);
    return { success: false, message };
  } finally {
    setLoading(false);
  }
};

