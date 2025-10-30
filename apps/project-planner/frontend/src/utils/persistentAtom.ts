import { atom } from 'nanostores';

export const AUTH_TOKEN_KEY = 'jwt_token';

/**
 * Creates a nanostore atom that persists its state to localStorage.
 * @param key The key to use in localStorage.
 * @param initialValue The initial value of the atom.
 * @returns A nanostore atom with persistence.
 */
export function persistentAtom<T>(key: string, initialValue: T) {
  const storedValue = localStorage.getItem(key);
  const initial = storedValue ? JSON.parse(storedValue) : initialValue;

  const store = atom<T>(initial);

  store.listen((value) => {
    localStorage.setItem(key, JSON.stringify(value));
  });

  return store;
}
