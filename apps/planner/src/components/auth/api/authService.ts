import axios from 'axios';
import { getAuthToken } from '@/components/auth/stores/authStore';
import type { LoginCredentials, UserProfile, AuthResponse } from '@/components/auth/types/auth';

const API_BASE_URL = '/api';

/**
 * Service for interacting with the backend authentication API.
 */
export const authService = {
  /**
   * Authenticates a user with email and password.
   * @param credentials - User's email and password.
   * @returns A promise that resolves to AuthResponse containing the JWT token and user profile.
   * @throws Error if login fails.
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/login`, credentials, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message || 'Login failed');
      }
      throw new Error((error as Error).message || 'An unknown error occurred during login');
    }
  },

  /**
   * Logs out the current user by invalidating the session on the backend.
   * Clears any client-side session state regardless of backend success.
   * @returns A promise that resolves when the logout attempt is complete.
   */
  logout: async (): Promise<void> => {
    const token = getAuthToken();
    if (!token) return; // Already logged out or no token

    try {
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    } catch (error) {
      console.error('Logout failed on backend:', error);
      // Even if backend logout fails, client-side state will be cleared by authStore action
    }
  },

  /**
   * Fetches the profile of the currently authenticated user.
   * Requires an active JWT token.
   * @returns A promise that resolves to the UserProfile.
   * @throws Error if the token is missing or fetching the profile fails.
   */
  getProfile: async (): Promise<UserProfile> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token is missing. Please log in.');
    }

    try {
      const response = await axios.get<UserProfile>(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || error.message || 'Failed to fetch user profile',
        );
      }
      throw new Error(
        (error as Error).message || 'An unknown error occurred while fetching profile',
      );
    }
  },
};
