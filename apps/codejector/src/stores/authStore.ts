import { map } from 'nanostores';
import { persistentAtom } from '@/utils/persistentAtom';
import { UserProfile, AuthState } from '@/types/auth';

export const authStore = map<AuthState>({
  isLoggedIn: false,
  user: null,
  loading: true,
  error: null,
});
export const token = persistentAtom<string | null>('token', null);
export const getToken = () => {
  if (token) return token.get();
};
export const setToken = (tokenString: string | null) => {
  if (tokenString) setLoading(false);
  token.set(tokenString);
};

export const loginSuccess = (user: UserProfile, token: string) => {
  if (token) setToken(token);
  authStore.set({
    isLoggedIn: true,
    user,
    loading: false,
    error: null,
  });
};

export const logout = () => {
  setToken(null);
  setLoading(false);
  authStore.set({
    isLoggedIn: false,
    user: null,
    loading: false,
    error: null,
  });
};

export const setLoading = (isLoading: boolean) =>
  authStore.setKey('loading', isLoading);

export const setError = (message: string | null) =>
  authStore.setKey('error', message);
