import { map } from 'nanostores';

interface ThemeState {
  mode: 'light' | 'dark';
}

const getInitialThemeMode = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    const storedMode = localStorage.getItem('themeMode');
    if (storedMode === 'light' || storedMode === 'dark') {
      return storedMode;
    }
    // Check prefers-color-scheme if no stored mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  return 'light'; // Default to light mode
};

export const themeStore = map<ThemeState>({
  mode: getInitialThemeMode(),
});

export const toggleThemeMode = () => {
  const currentMode = themeStore.get().mode;
  const newMode = currentMode === 'light' ? 'dark' : 'light';
  themeStore.setKey('mode', newMode);
  localStorage.setItem('themeMode', newMode);
};

export const setThemeMode = (mode: 'light' | 'dark') => {
  themeStore.setKey('mode', mode);
  localStorage.setItem('themeMode', mode);
};

