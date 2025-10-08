import { atom } from 'nanostores';

export interface Message {
  role: 'user' | 'ai';
  text: string;
}

export const aiChatStore = atom({
  messages: [] as Message[],
  loading: false,
  error: null as string | null,
});

export function addMessage(message: Message) {
  aiChatStore.set({
    ...aiChatStore.get(),
    messages: [...aiChatStore.get().messages, message],
  });
}

export function setLoading(loading: boolean) {
  aiChatStore.set({
    ...aiChatStore.get(),
    loading: loading,
  });
}

export function setError(error: string | null) {
  aiChatStore.set({
    ...aiChatStore.get(),
    error: error,
  });
}
