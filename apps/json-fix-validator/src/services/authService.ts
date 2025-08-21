import { loginSuccess, logout, setLoading, setError } from '@/stores/authStore';
import { UserProfile } from '@/types/auth';

const API_BASE_URL = '/api/auth'; // Using proxy defined in vite.config.ts

/**
 * Handles logging out the user by calling the backend logout endpoint.
 * Clears local auth state.
 */
export const handleLogout = async () => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      // Backend is expected to clear httpOnly cookie
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Logout failed');
    }

    logout();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An unknown error occurred during logout.');
  } finally {
    setLoading(false);
  }
};

/**
 * Checks the current authentication status by calling the backend '/me' endpoint.
 * Updates the auth store based on the response.
 */
export const checkAuthStatus = async () => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetch(`${API_BASE_URL}/me`);
    if (response.ok) {
      const user: UserProfile = await response.json();
      // Backend /me endpoint returns null if not logged in, or user object
      if (user && user.id) {
        // Check for a valid user object to ensure logged in
        loginSuccess(user);
      } else {
        logout(); // Explicitly log out if /me returns null/empty (e.g., after token expires)
      }
    } else {
      // If response not ok (e.g., 401 Unauthorized), it means user is not logged in.
      logout();
    }
  } catch (err) {
    // Network errors or other exceptions during the fetch call
    console.error('Failed to check authentication status:', err);
    setError('Failed to check authentication status. Please try again.');
    logout(); // Assume not logged in on network error
  } finally {
    setLoading(false);
  }
};
