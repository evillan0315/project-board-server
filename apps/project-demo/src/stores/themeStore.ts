import { atom } from 'nanostores';

interface ThemeState {
  theme: 'light' | 'dark';
}

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
    return localStorage.getItem('theme') as 'light' | 'dark';
  }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

export const themeAtom = atom<ThemeState>({
  theme: getInitialTheme(),
});

// Action to toggle theme
export const toggleTheme = () => {
  const currentTheme = themeAtom.get().theme;
  themeAtom.set({
    theme: currentTheme === 'light' ? 'dark' : 'light',
  });
};

// Side effects: persist theme to localStorage and apply class to documentElement
themeAtom.listen((state) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('theme', state.theme);
  }
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
  }
});
