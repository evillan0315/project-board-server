import { map } from 'nanostores';
import { GeminiLiveAudioState } from '@/types';

export const geminiLiveStore = map<GeminiLiveAudioState>({
  sessionId: null,
  isSessionActive: false,
  isRecording: false,
  microphonePermissionGranted: false,
  userTranscript: '',
  aiResponseText: '',
  aiResponseAudioQueue: [],
  currentInputText: '',
  loading: false,
  error: null,
});

export const setSessionId = (id: string | null) => {
  geminiLiveStore.setKey('sessionId', id);
};

export const setIsSessionActive = (active: boolean) => {
  geminiLiveStore.setKey('isSessionActive', active);
};

export const setIsRecording = (recording: boolean) => {
  geminiLiveStore.setKey('isRecording', recording);
};

export const setMicrophonePermissionGranted = (granted: boolean) => {
  geminiLiveStore.setKey('microphonePermissionGranted', granted);
};

export const appendUserTranscript = (text: string) => {
  const currentTranscript = geminiLiveStore.get().userTranscript;
  geminiLiveStore.setKey('userTranscript', currentTranscript + text);
};

export const setInitialUserText = (text: string) => {
  geminiLiveStore.setKey('currentInputText', text);
};

export const appendAiResponseText = (text: string) => {
  const currentResponse = geminiLiveStore.get().aiResponseText;
  geminiLiveStore.setKey('aiResponseText', currentResponse + text);
};

export const enqueueAiResponseAudio = (audioDataUrl: string) => {
  if (!audioDataUrl) {
    return; // Do not enqueue empty or null audio data
  }
  geminiLiveStore.setKey('aiResponseAudioQueue', [
    ...geminiLiveStore.get().aiResponseAudioQueue,
    audioDataUrl,
  ]);
};

export const dequeueAiResponseAudio = () => {
  const queue = geminiLiveStore.get().aiResponseAudioQueue;
  if (queue.length > 0) {
    geminiLiveStore.setKey('aiResponseAudioQueue', queue.slice(1));
  }
};

export const clearAiResponseAudioQueue = () => {
  geminiLiveStore.setKey('aiResponseAudioQueue', []);
};

export const setLoading = (isLoading: boolean) => {
  geminiLiveStore.setKey('loading', isLoading);
};

export const setError = (message: string | null) => {
  geminiLiveStore.setKey('error', message);
};

export const clearGeminiLiveState = () => {
  geminiLiveStore.set({
    sessionId: null,
    isSessionActive: false,
    isRecording: false,
    microphonePermissionGranted: false,
    userTranscript: '',
    aiResponseText: '',
    aiResponseAudioQueue: [], // Cleared explicitly
    currentInputText: '',
    loading: false,
    error: null,
  });
  clearAiResponseAudioQueue(); // Ensure queue is cleared
};
