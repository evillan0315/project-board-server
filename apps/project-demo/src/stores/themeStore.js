import { atom } from 'nanostores';
const getInitialTheme = () => {
  if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
    return localStorage.getItem('theme');
  }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};
export const themeAtom = atom({
  theme: getInitialTheme(),
});
// Action to toggle theme
export const toggleTheme = () => {
  themeAtom.set((state) => ({
    theme: state.theme === 'light' ? 'dark' : 'light',
  }));
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
