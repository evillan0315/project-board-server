import { io, Socket } from 'socket.io-client';
import { getToken } from '@/stores/authStore';
import {
  setSessionId,
  setIsSessionActive,
  setIsRecording,
  appendAiResponseText,
  enqueueAiResponseAudio,
  setLoading,
  setError,
  clearGeminiLiveState,
  geminiLiveStore, // Import geminiLiveStore to access state directly
} from '@/stores/geminiLiveStore';
import {
  LiveConnectOptionsDto,
  LiveAudioInputDto,
  ProcessTurnDto,
  LiveEndSessionDto,
  LiveTurnResultDto,
  LiveMessageDto,
  LiveTextInputDto,
} from '@/types';

const API_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
const GEMINI_WS_NAMESPACE = '/gemini';

let socket: Socket | null = null;

export const connectGeminiLive = (options: LiveConnectOptionsDto) => {
  setLoading(true);
  setError(null);

  if (socket && socket.connected) {
    console.warn('Already connected to Gemini Live WebSocket.');
    setLoading(false);
    return;
  }

  const token = getToken();
  if (!token) {
    setError('Authentication token missing. Please log in.');
    setLoading(false);
    return;
  }

  socket = io(API_URL + GEMINI_WS_NAMESPACE, {
    transports: ['websocket'],
    auth: {
      token: `Bearer ${token}`,
    },
  });

  socket.on('connect', () => {
    console.log('Connected to Gemini Live WebSocket.');
    // Emit startLiveSession after successful connection
    socket?.emit('startLiveSession', options);
  });

  socket.on('sessionStarted', (response: { sessionId: string }) => {
    console.log('Gemini Live Session Started:', response.sessionId);
    setSessionId(response.sessionId);
    setIsSessionActive(true);
    setLoading(false);
    setError(null);
    appendAiResponseText('Gemini session started. You can start speaking now.');
  });

  socket.on('aiResponse', (result: LiveTurnResultDto) => {
    console.log('AI Response:', result);
    if (result.texts && result.texts.length > 0) {
      appendAiResponseText(result.texts.join(' '));
    }
    if (result.messages) {
      result.messages.forEach((msg: LiveMessageDto) => {
        // Check if the message contains audio data
        if (msg.data && msg.data.startsWith('data:audio/')) {
          enqueueAiResponseAudio(msg.data);
        } else if (msg.data) {
          // If it's data but not audio URL, could be inline data, handle as needed
          console.log('Received non-audio data:', msg.data);
        }
      });
    }
  });

  socket.on(
    'audioInputBuffered',
    (response: { sessionId: string; success: boolean }) => {
      // console.log('Audio chunk buffered:', response.sessionId);
      // No specific UI update needed for individual chunk buffering unless desired
    },
  );

  socket.on('sessionEnded', (response: { sessionId: string }) => {
    console.log('Gemini Live Session Ended:', response.sessionId);
    disconnectGeminiLive();
    appendAiResponseText('Gemini session ended.');
  });

  socket.on('turnComplete', (response: { sessionId: string }) => {
    // console.log('AI turn complete for session', response.sessionId);
    // The AI response is already handled by 'aiResponse' event, this is an additional signal
  });

  socket.on('error', (message: string) => {
    console.error('Gemini Live WebSocket Error:', message);
    setError(`WebSocket error: ${message}`);
    setLoading(false);
  });

  socket.on('unauthorized', (message: { message: string }) => {
    console.error('Gemini Live Unauthorized:', message.message);
    setError(`Unauthorized: ${message.message}. Please log in again.`);
    disconnectGeminiLive(); // Force disconnect on auth error
  });

  socket.on('disconnect', (reason) => {
    if (reason === 'io client disconnect') {
      console.log(
        'Cleanly disconnected from Gemini Live WebSocket: client initiated.',
      );
    } else {
      console.log('Disconnected from Gemini Live WebSocket:', reason);
      setError(`Disconnected: ${reason}. Attempting to reconnect...`);
    }
    setIsSessionActive(false);
    setIsRecording(false);
    setSessionId(null);
    setLoading(false);
  });
};

export const disconnectGeminiLive = () => {
  if (socket) {
    // Correctly access sessionId from the store before using it
    const currentSessionId = geminiLiveStore.get().sessionId;
    if (currentSessionId) {
      socket.emit('endLiveSession', {
        sessionId: currentSessionId,
      } as LiveEndSessionDto);
    }
    socket.disconnect();
    socket = null;
    clearGeminiLiveState();
  }
};

export const sendAudioChunk = (
  sessionId: string,
  audioChunk: string,
  mimeType: string,
) => {
  if (socket && socket.connected && sessionId) {
    socket.emit('audioInput', {
      sessionId,
      audioChunk,
      mimeType,
    } as LiveAudioInputDto);
  } else {
    console.warn(
      'Cannot send audio chunk: Socket not connected or session ID missing.',
    );
    setError('Cannot send audio: session not active.');
  }
};

// Debounced function to trigger AI processing turn after inactivity
// This will be used after a period of user silence or manual stop
export const processGeminiTurn = (sessionId: string) => {
  if (socket && socket.connected && sessionId) {
    console.log('Emitting processTurn for session:', sessionId);
    socket.emit('processTurn', { sessionId } as ProcessTurnDto);
    setLoading(true); // Indicate that we are waiting for AI response
  } else {
    console.warn(
      'Cannot process turn: Socket not connected or session ID missing.',
    );
    setError('Cannot process turn: session not active.');
  }
};

export const sendInitialTextInput = (sessionId: string, text: string) => {
  if (socket && socket.connected && sessionId && text) {
    console.log('Emitting textInput for session:', sessionId);
    socket.emit('textInput', { sessionId, text } as LiveTextInputDto);
    setLoading(true); // Indicate waiting for AI response
  } else {
    console.warn(
      'Cannot send text input: Socket not connected or session ID missing, or text empty.',
    );
    setError('Cannot send text input: session not active or text empty.');
  }
};
