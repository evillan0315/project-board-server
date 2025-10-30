import { atom } from 'nanostores';
import { PaletteMode } from '@mui/material';
import { persistentAtom } from '@/utils/persistentAtom';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

interface ThemeState {
  mode: PaletteMode;
}

export const snackbarStore = atom<SnackbarState>({
  open: false,
  message: '',
  severity: 'info',
});

export const themeStore = persistentAtom<ThemeState>('theme', { mode: 'light' });

export const showSnackbar = (message: string, severity: SnackbarState['severity'] = 'info') => {
  snackbarStore.set({
    open: true,
    message,
    severity,
  });
};

export const hideSnackbar = () => {
  snackbarStore.set({ ...snackbarStore.get(), open: false });
};

export const toggleTheme = () => {
  themeStore.set({ mode: themeStore.get().mode === 'light' ? 'dark' : 'light' });
  // You might need to re-initialize the MUI theme here or in App.tsx
  window.location.reload(); // Simple way to apply theme change for now
};
