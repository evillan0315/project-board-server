import { map } from 'nanostores';
import { UserProfile, AuthState } from '@/types/auth';
import { fetchUserProfile } from '@/services/authService'; // Assume you have an API call to fetch user info from token

// --- Auth Store ---
export const authStore = map<AuthState>({
  isLoggedIn: false,
  user: null,
  loading: true, // Initially true while checking auth status
  error: null,
});

// --- Token Helpers ---
export const getToken = (): string | null => localStorage.getItem('token');

const setToken = (token: string | null) => {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
};

// --- Auth Actions ---
export const loginSuccess = (user: UserProfile, token?: string) => {
  setToken(token || null);
  authStore.set({
    isLoggedIn: true,
    user,
    loading: false,
    error: null,
  });
};

export const logout = () => {
  setToken(null);
  authStore.set({
    isLoggedIn: false,
    user: null,
    loading: false,
    error: null,
  });
};

export const setLoading = (loading: boolean) => authStore.setKey('loading', loading);

export const setError = (error: string | null) => authStore.setKey('error', error);

// --- Auto-load user on app start ---
export const initializeAuth = async () => {
  const token = getToken();
  if (!token) {
    authStore.set({ isLoggedIn: false, user: null, loading: false, error: null });
    return;
  }

  try {
    setLoading(true);
    const user = await fetchUserProfile(token); // Fetch user info using token
    loginSuccess(user, token);
  } catch (err: any) {
    console.error('Failed to validate token:', err);
    logout();
    setError(err instanceof Error ? err.message : String(err));
  } finally {
    setLoading(false);
  }
};

// Call this at the root of your app, e.g., in App.tsx or main.tsx
// initializeAuth();

