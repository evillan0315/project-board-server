import { map } from 'nanostores';
import { UserProfile, AuthState } from '@/types/auth';

export const authStore = map<AuthState>({
  isLoggedIn: false,
  user: null,
  loading: true, // Set to true initially to indicate loading auth status on app start
  error: null,
});
export const getToken = () => {
  const localToken = localStorage.getItem('token');
  return localToken;
};
export const loginSuccess = (user: UserProfile, token?: string) => {
  // Update localStorage
  if (token) {
    localStorage.setItem('token', token);
  }
  authStore.set({
    isLoggedIn: true,
    user,
    loading: false,
    error: null,
  });
};

export const logout = () => {
  localStorage.removeItem('token'); // Clear token on logout
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
