import { atom } from 'nanostores';
import { authService } from '@/components/auth/api/authService';
import type { LoginCredentials, UserProfile } from '@/components/auth/types/auth';

/**
 * Interface representing the authentication state in the store.
 */
interface AuthState {
  isLoggedIn: boolean;
  token: string | null;
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}

// Load initial token from localStorage if available
const initialToken = localStorage.getItem('jwt_token');

/**
 * Nanostore atom for managing global authentication state.
 */
export const authStore = atom<AuthState>({
  isLoggedIn: !!initialToken,
  token: initialToken,
  user: null, // User profile will be fetched on login or app init
  loading: false,
  error: null,
});

// Subscribe to changes and persist the token to localStorage
authStore.listen((state) => {
  if (state.token) {
    localStorage.setItem('jwt_token', state.token);
  } else {
    localStorage.removeItem('jwt_token');
  }
});

/**
 * Sets authentication details (token and user profile) in the store.
 * Useful for handling OAuth callbacks where the token and initial user data are provided.
 * @param token - The JWT token.
 * @param user - The user's profile data.
 */
export const setAuthDetails = (token: string, user: UserProfile) => {
  authStore.set({
    isLoggedIn: true,
    token,
    user,
    loading: false,
    error: null,
  });
};

/**
 * Initiates a login request to the backend with provided credentials.
 * Updates the store with success or error state.
 * @param credentials - User's email and password.
 * @returns An object indicating success or containing an error message.
 */
export const loginUser = async (credentials: LoginCredentials) => {
  authStore.set({ ...authStore.get(), loading: true, error: null });
  try {
    const { token, user } = await authService.login(credentials);
    setAuthDetails(token, user);
    return { success: true };
  } catch (error) {
    const errorMessage = (error as Error).message || 'Login failed';
    authStore.set({
      ...authStore.get(),
      loading: false,
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
};

/**
 * Logs out the current user. Calls the backend logout endpoint and clears client-side state.
 */
export const logoutUser = async () => {
  await authService.logout(); // Attempt to invalidate session on backend
  authStore.set({
    isLoggedIn: false,
    token: null,
    user: null,
    loading: false,
    error: null,
  });
};

/**
 * Fetches the profile of the currently authenticated user from the backend.
 * Updates the store with the user profile or logs out if the token is invalid.
 */
export const fetchUserProfile = async () => {
  const current = authStore.get();
  if (!current.token || current.user) return; // No token or already fetched

  authStore.set({ ...current, loading: true, error: null });
  try {
    const user = await authService.getProfile();
    authStore.set({ ...current, user, loading: false, error: null });
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    // If fetching profile fails, token might be invalid or expired. Log out.
    logoutUser();
    authStore.set({
      ...authStore.get(),
      error: (error as Error).message,
      loading: false,
    });
  }
};

/**
 * Initializes the authentication store. Called once on app start.
 * Checks for an existing token and attempts to fetch the user profile if logged in.
 */
export const initAuth = async () => {
  const current = authStore.get();
  if (current.isLoggedIn && current.token && !current.user) {
    await fetchUserProfile();
  }
};

/**
 * Selector function to get the current authentication token.
 * @returns The JWT token or null if not logged in.
 */
export const getAuthToken = (): string | null => {
  return authStore.get().token;
};
