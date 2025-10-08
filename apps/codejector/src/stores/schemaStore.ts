import { persistentAtom } from '@/utils/persistentAtom';
import { atom } from 'nanostores';

export const schemaStore = persistentAtom<any>('generatedSchema', null);
