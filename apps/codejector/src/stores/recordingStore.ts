import { persistentAtom } from '@/utils/persistentAtom';

export const currentRecordingIdStore = persistentAtom<string | null>(
  'currentRecordingId',
  null,
);
export const isScreenRecordingStore = persistentAtom<boolean>(
  'isScreenRecording',
  false,
); // Renamed from isCurrentRecording for clarity

export const currentCameraRecordingIdStore = persistentAtom<string | null>(
  'currentCameraRecordingId',
  null,
);
export const isCameraRecordingStore = persistentAtom<boolean>(
  'isCameraRecording',
  false,
);

export const setIsScreenRecording = (isRecording: boolean) => {
  isScreenRecordingStore.set(isRecording);
};

export const setIsCameraRecording = (isRecording: boolean) => {
  isCameraRecordingStore.set(isRecording);
};

export const editRecordingStore = persistentAtom<any>('editRecording', {});
