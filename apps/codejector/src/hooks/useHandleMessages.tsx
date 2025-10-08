import { useState } from 'react';
import { generateText } from '@/api/ai';
import { GenerateTextDto } from '@/types/ai';

interface Message {
  role: 'user' | 'model' | 'system';
  text: string;
}

interface UseHandleMessages {
  messages: Message[];
  sendMessage: (text: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const useHandleMessages = (): UseHandleMessages => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (text: string) => {
    setLoading(true);
    setError(null);
    const userMessage: Message = { role: 'user', text };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      const data: GenerateTextDto = { prompt: text };
      const response = await generateText(data);
      const modelMessage: Message = { role: 'model', text: response };
      setMessages((prevMessages) => [...prevMessages, modelMessage]);
    } catch (e: any) {
      setError(e.message || 'Failed to send message');
      const errorMsg: Message = {
        role: 'system',
        text: `Error: ${e.message || 'Failed to generate text.'}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    sendMessage,
    loading,
    error,
  };
};

export default useHandleMessages;
