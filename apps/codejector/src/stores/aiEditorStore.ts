import { persistentAtom } from '@/utils/persistentAtom';
import { useStore } from '@nanostores/react';
import { atom, map } from 'nanostores';

export * from './snackbarStore';

export const autoApplyChanges = persistentAtom<boolean>(
  'autoApplyChanges',
  false,
);
export const setAutoApplyChanges = (value: boolean) => {
  autoApplyChanges.set(value);
};

export const aiEditorStore = persistentAtom<string | {}>(
  'ai-editor-settings',
  {},
);

export const useAiEditorSettings = () => useStore(aiEditorStore);

export const setAiEditorSettings = (settings: any) =>
  aiEditorStore.set(settings);
