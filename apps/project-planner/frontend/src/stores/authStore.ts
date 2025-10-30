import { atom } from 'nanostores';
import { persistentAtom } from '@/utils/persistentAtom';
import { IAuthUser } from '@/types/auth';

interface AuthStore {
  isAuthenticated: boolean;
  user: IAuthUser | null;
  token: string | null;
}

export const authStore = persistentAtom<AuthStore>('auth', {
  isAuthenticated: false,
  user: null,
  token: null,
});

export const login = (user: IAuthUser, token: string) => {
  authStore.set({
    isAuthenticated: true,
    user,
    token,
  });
};

export const logout = () => {
  authStore.set({
    isAuthenticated: false,
    user: null,
    token: null,
  });
};
