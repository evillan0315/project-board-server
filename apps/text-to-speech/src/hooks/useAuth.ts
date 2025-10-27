import { useStore } from '@nanostores/react';
import { authStore, logoutUser, loginUser, fetchUserProfile } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import type { LoginCredentials } from '../types/auth';

/**
 * Custom hook for managing authentication state and actions.
 * Provides login, logout, and access to current user data.
 */
export const useAuth = () => {
  const { isLoggedIn, token, user, loading, error } = useStore(authStore);
  const navigate = useNavigate();

  useEffect(() => {
    // If logged in but user data is not loaded, attempt to fetch it.
    // Prevents infinite loop by checking !loading.
    if (isLoggedIn && !user && !loading) {
      fetchUserProfile();
    }
  }, [isLoggedIn, user, loading]);

  /**
   * Logs out the current user and navigates to the login page.
   */
  const logout = () => {
    logoutUser();
    navigate('/login');
  };

  /**
   * Attempts to log in a user with the provided credentials.
   * Navigates to the home page on success.
   * @param credentials - The user's login credentials.
   * @returns An object indicating success or containing an error message.
   */
  const login = async (credentials: LoginCredentials) => {
    const result = await loginUser(credentials);
    if (result.success) {
      navigate('/'); // Redirect to home on successful login
    }
    return result;
  };

  return { isLoggedIn, token, user, loading, error, login, logout };
};
