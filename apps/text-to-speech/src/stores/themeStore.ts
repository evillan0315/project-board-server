import { atom } from 'nanostores';

interface ThemeState {
  theme: 'light' | 'dark';
}

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof localStorage !== 'undefined') {
    const storedTheme = localStorage.getItem('theme');
    // Explicitly check if the stored value is one of the valid modes
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }
  }
  // Fallback to system preference or 'light'
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light'; // Ultimate fallback
};

// themeAtom is the primary store for theme state, used consistently across the app.
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
