import { map } from 'nanostores';
import { UserProfile, AuthState } from '@/types/auth';

export const authStore = map<AuthState>({
  isLoggedIn: false,
  user: null,
  loading: true, // Set to true initially to indicate loading auth status on app start
  error: null,
});

export const loginSuccess = (user: UserProfile) => {
  // Update localStorage
  if(user.accessToken){
    localStorage.setItem('token', user.accessToken);
  }
  authStore.set({
    isLoggedIn: true,
    user,
    loading: false,
    error: null,
  });
};

export const logout = () => {
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
