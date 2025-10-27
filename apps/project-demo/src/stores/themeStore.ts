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

// Function to update the theme and persist it
const updateTheme = (newTheme: 'light' | 'dark') => {
  themeAtom.set({ theme: newTheme });
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('theme', newTheme);
  }
  document.documentElement.classList.toggle('dark', newTheme === 'dark');
};

// Initialize class on document element
if (typeof document !== 'undefined') {
  document.documentElement.classList.toggle('dark', themeAtom.get().theme === 'dark');
}

// Actions
themeAtom.setKey = <K extends keyof ThemeState>(key: K, value: ThemeState[K]) => {
  updateTheme(value as 'light' | 'dark');
};

themeAtom.toggleTheme = () => {
  const currentTheme = themeAtom.get().theme;
  updateTheme(currentTheme === 'light' ? 'dark' : 'light');
};
