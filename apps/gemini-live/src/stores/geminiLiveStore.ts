import { map } from 'nanostores';
import { LiveSessionStatus, LiveMessage } from '@/types/gemini-live';

interface GeminiLiveState {
  sessionStatus: LiveSessionStatus; // 'disconnected', 'connecting', 'active', 'error'
  conversationHistory: LiveMessage[];
  currentConversationId: string | null;
  currentAudioPlaybackUrl: string | null;
  error: string | null;
}

export const geminiLiveStore = map<GeminiLiveState>({
  sessionStatus: 'disconnected',
  conversationHistory: [],
  currentConversationId: null,
  currentAudioPlaybackUrl: null,
  error: null,
});

export const setSessionStatus = (status: LiveSessionStatus) => {
  geminiLiveStore.setKey('sessionStatus', status);
  // `sessionActive` is now derived from `sessionStatus` in components and hooks.
  if (status === 'disconnected' || status === 'error') {
    geminiLiveStore.setKey('currentAudioPlaybackUrl', null);
  }
};

export const addMessage = (message: LiveMessage) => {
  geminiLiveStore.setKey('conversationHistory', [
    ...geminiLiveStore.get().conversationHistory,
    message,
  ]);
};

export const setAudioPlaybackUrl = (url: string | null) => {
  geminiLiveStore.setKey('currentAudioPlaybackUrl', url);
};

export const setGeminiError = (message: string | null) => {
  geminiLiveStore.setKey('error', message);
  if (message) {
    setSessionStatus('error');
  }
};

export const clearConversation = () => {
  geminiLiveStore.set({
    sessionStatus: 'disconnected',
    conversationHistory: [],
    currentConversationId: null,
    currentAudioPlaybackUrl: null,
    error: null,
  });
};
