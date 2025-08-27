import { map } from 'nanostores';
import { AuthState, UserProfile } from '@/types/auth';

export const authStore = map<AuthState>({
  isLoggedIn: false,
  user: null,
  loading: true, // Set to true initially to indicate loading auth status on app start
  error: null,
});

export const loginSuccess = (user: UserProfile, token) => {
  if (token) localStorage.setItem('token', token);
  authStore.set({
    isLoggedIn: true,
    user,
    loading: false,
    error: null,
  });
};

export const logout = () => {
  // Invalidate any local storage items potentially related to auth (though for httpOnly cookies, not strictly needed)
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token'); // Remove any old or manually set tokens
  }
  authStore.set({
    isLoggedIn: false,
    user: null,
    loading: false,
    error: null,
  });
};

export const setLoading = (isLoading: boolean) => {
  authStore.setKey('loading', isLoading);
};

export const setError = (message: string | null) => {
  authStore.setKey('error', message);
};
