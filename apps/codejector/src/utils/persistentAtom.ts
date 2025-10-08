import { atom } from 'nanostores';

export function persistentAtom<T>(key: string, initialValue: T) {
  const stored =
    typeof window !== 'undefined' ? localStorage.getItem(key) : null;

  const initial = stored ? JSON.parse(stored) : initialValue;
  const store = atom<T>(initial);

  if (typeof window !== 'undefined') {
    store.listen((value) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  }

  return store;
}
