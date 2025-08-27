import { atom } from 'nanostores';

export interface ChatMessage {
  id: string; // Unique ID for React key prop
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isTyping?: boolean; // For AI, indicates it's still generating text
}

export interface LiveInteractionState {
  isConnected: boolean;
  isRecording: boolean;
  messages: ChatMessage[]; // Unified conversation history
  aiSpeaking: boolean; // True when AI is generating/playing audio
  conversationId: string | null;
  error: string | null;
  isLoading: boolean; // For initial session start, etc.
  initialPromptInput: string; // Text for the initial prompt input field
}

export const liveStore = atom<LiveInteractionState>({
  isConnected: false,
  isRecording: false,
  messages: [],
  aiSpeaking: false,
  conversationId: null,
  error: null,
  isLoading: false,
  initialPromptInput: '',
});

export const setConnected = (status: boolean) => {
  liveStore.set({ ...liveStore.get(), isConnected: status });
};

export const startRecording = () => {
  liveStore.set({ ...liveStore.get(), isRecording: true, error: null });
};

export const stopRecording = () => {
  liveStore.set({ ...liveStore.get(), isRecording: false });
};

export const appendMessage = (role: 'user' | 'ai', content: string, isTyping: boolean = false) => {
  const currentMessages = liveStore.get().messages;
  const lastMessage = currentMessages[currentMessages.length - 1];

  // If the last message is from the same role and is still 'typing', append content to it
  if (lastMessage && lastMessage.role === role && lastMessage.isTyping) {
    lastMessage.content += content;
    liveStore.set({ ...liveStore.get(), messages: [...currentMessages.slice(0, -1), lastMessage] });
  } else {
    // Otherwise, create a new message
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      role,
      content,
      timestamp: new Date(),
      isTyping,
    };
    liveStore.set({ ...liveStore.get(), messages: [...currentMessages, newMessage] });
  }
};

export const updateLastMessageTypingStatus = (role: 'user' | 'ai', isTyping: boolean) => {
  const currentMessages = liveStore.get().messages;
  const lastMessage = currentMessages[currentMessages.length - 1];

  if (lastMessage && lastMessage.role === role) {
    lastMessage.isTyping = isTyping;
    liveStore.set({ ...liveStore.get(), messages: [...currentMessages.slice(0, -1), lastMessage] });
  } else if (currentMessages.length > 0 && !isTyping) {
    // Edge case: If for some reason the last message isn't from the expected role
    // but we received a turnComplete, ensure no message is left 'typing'.
    // This could happen if a text response was immediate and transcription was delayed.
    // Iterate backwards to find the last message from the role and set isTyping to false
    for (let i = currentMessages.length - 1; i >= 0; i--) {
      if (currentMessages[i].role === role && currentMessages[i].isTyping) {
        currentMessages[i].isTyping = false;
        liveStore.set({ ...liveStore.get(), messages: [...currentMessages] });
        break;
      }
    }
  }
};

export const setAiSpeaking = (speaking: boolean) => {
  liveStore.set({ ...liveStore.get(), aiSpeaking: speaking });
};

export const setConversationId = (id: string | null) => {
  liveStore.set({ ...liveStore.get(), conversationId: id });
};

export const setError = (message: string | null) => {
  liveStore.set({ ...liveStore.get(), error: message });
};

export const setIsLoading = (loading: boolean) => {
  liveStore.set({ ...liveStore.get(), isLoading: loading });
};

export const setInitialPromptInput = (text: string) => {
  liveStore.set({ ...liveStore.get(), initialPromptInput: text });
};

export const resetLiveInteraction = () => {
  liveStore.set({
    isConnected: false,
    isRecording: false,
    messages: [],
    aiSpeaking: false,
    conversationId: null,
    error: null,
    isLoading: false,
    initialPromptInput: '',
  });
};
