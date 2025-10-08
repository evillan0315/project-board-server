import { atom } from 'nanostores';
import { persistentAtom } from '@/utils/persistentAtom';
export const currentURL = persistentAtom<string>('currentPage', '');
