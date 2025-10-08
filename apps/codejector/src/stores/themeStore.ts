import { map } from 'nanostores';

interface ThemeState {
  mode: 'light' | 'dark';
}

// Initialize mode from localStorage or system preference
const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  return 'light';
};

export const themeStore = map<ThemeState>({
  mode: getInitialTheme(),
});

export const toggleTheme = () => {
  const state = themeStore.get(); // Get current state
  const newMode = state.mode === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', newMode);
  themeStore.set({ mode: newMode }); // Set new full state
};

export const setTheme = (mode: 'light' | 'dark') => {
  themeStore.set({ mode });
  localStorage.setItem('theme', mode);
};
