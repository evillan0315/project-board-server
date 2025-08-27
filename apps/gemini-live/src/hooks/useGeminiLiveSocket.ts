import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import {
  geminiLiveStore,
  addMessage,
  setSessionStatus,
  // setAudioPlaybackUrl, // Removed as AI audio output is no longer directly supported by this setup
  setGeminiError,
} from '@/stores/geminiLiveStore';
import {
  LiveTurnResultDto,
  LiveConnectOptionsDto,
  LiveTextInputDto,
  LiveAudioInputDto,
  ProcessTurnDto,
  LiveEndSessionDto,
  LiveSessionResponseDto,
  LiveMessage, // Frontend-specific message type for display
  LiveConfigDto, // Imported from backend DTOs for connectSocket signature
} from '@/types/gemini-live'; // Import from your frontend types file

interface UseGeminiLiveSocketResult {
  connectSocket: (initialText?: string, config?: LiveConfigDto) => void; // Updated signature
  disconnectSocket: () => void;
  sendAudioChunk: (chunk: ArrayBuffer, mimeType: string) => void;
  sendTextMessage: (text: string) => void;
  processTurn: () => void; // New function to trigger AI processing
  sessionActive: boolean;
  socketConnected: boolean;
  error: string | null;
  currentSessionId: string | null; // Renamed to currentSessionId to match backend
}

// Use VITE_API_URL, and assume /api is a proxy to the NestJS backend which then handles /gemini namespace
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const GEMINI_NAMESPACE = '/gemini';

const useGeminiLiveSocket = (): UseGeminiLiveSocketResult => {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useStore(authStore);
  const { sessionStatus, currentConversationId: storedCurrentSessionId } =
    useStore(geminiLiveStore); // Use a new local variable for clarity

  const [socketConnected, setSocketConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Aligning name with backend sessionId for clarity
  const currentSessionId = storedCurrentSessionId;

  const getAuthToken = useCallback(() => localStorage.getItem('token'), []);

  const connectSocket = useCallback(
    (initialText?: string, config?: LiveConfigDto) => {
      if (socketRef.current?.connected) {
        console.warn('Socket already connected. Ignoring new connection request.');
        return;
      }

      setSessionStatus('connecting');
      setError(null);
      setGeminiError(null);

      const token = getAuthToken();
      if (!token) {
        const authError = 'Authentication token not found. Please log in.';
        setError(authError);
        setGeminiError(authError);
        setSessionStatus('error');
        return;
      }

      // Construct the full WebSocket URL, assuming API_BASE_URL handles the HTTP proxy
      // and Socket.IO will then connect to the correct WS endpoint.
      // Example: If VITE_API_URL is '/api', socket.io-client might correctly infer ws://<host>/api/gemini
      // Or, if VITE_API_URL is 'http://localhost:3000', it will connect to http://localhost:3000/gemini
      const socketUrl = `${API_BASE_URL}${GEMINI_NAMESPACE}`;
      this.console.log(`Attempting to connect to socket at: ${socketUrl}`);

      const socket = io(socketUrl, {
        auth: { token: `Bearer ${token}` },
        transports: ['websocket'],
        withCredentials: true,
        extraHeaders: {
          Authorization: `Bearer ${token}`, // Ensure this is always sent if `auth` field isn't fully robust
        },
        query: {
          userId: user?.id || 'anonymous', // Backend should extract user from JWT anyway, but useful for initial logging
        },
      });

      socket.on('connect', () => {
        setSocketConnected(true);
        setError(null);
        console.log('Socket connected. Emitting startLiveSession...');

        // Construct payload according to backend's @MessageBody() payload: { options?: LiveConnectOptionsDto }
        const startPayloadOptions: LiveConnectOptionsDto = {
          config: config,
          initialText: initialText, // Send initial text with start session
        };
        socket.emit('startLiveSession', { options: startPayloadOptions });
        addMessage({ sender: 'system', text: 'Gemini Live session starting...' });
      });

      socket.on('disconnect', (reason) => {
        setSocketConnected(false);
        setSessionStatus('disconnected');
        addMessage({ sender: 'system', text: `Session disconnected: ${reason}` });
        console.log('Socket disconnected:', reason);
        // Clear session data if disconnect is final
        geminiLiveStore.setKey('currentConversationId', null);
        geminiLiveStore.setKey('conversationHistory', []);
        setGeminiError(null);
      });

      socket.on('connect_error', (err: Error) => {
        setError(`Connection error: ${err.message}`);
        setGeminiError(`Connection error: ${err.message}`);
        setSocketConnected(false);
        setSessionStatus('error');
        console.error('Socket connection error:', err);
      });

      // Updated to match backend's LiveSessionResponseDto
      socket.on('sessionStarted', (response: LiveSessionResponseDto) => {
        setSessionStatus('active');
        geminiLiveStore.setKey('currentConversationId', response.sessionId); // Store the actual sessionId
        addMessage({ sender: 'system', text: `Session ${response.sessionId} started.` });
        console.log('Session started:', response.sessionId);

        // If initialText was provided to connectSocket, it was sent to the backend
        // The frontend should now add it to its own conversation history for display
        // and then explicitly call processTurn to get the first AI response.
        if (initialText) {
          addMessage({ sender: 'user', text: initialText });
          processTurn(); // Trigger the first turn processing immediately after initial text
        }
      });

      socket.on('sessionEnded', (response: LiveEndSessionDto) => {
        setSessionStatus('disconnected');
        addMessage({
          sender: 'system',
          text: `Session ${response.sessionId} ended.`,
        });
        console.log('Session ended:', response.sessionId);
        geminiLiveStore.setKey('currentConversationId', null);
        geminiLiveStore.setKey('conversationHistory', []);
        // setAudioPlaybackUrl(null); // Removed due to lack of direct AI audio output
      });

      // This handler now expects LiveTurnResultDto from the backend
      socket.on('aiResponse', (response: LiveTurnResultDto) => {
        console.log('Received aiResponse:', response);

        // Process each message part within the turn
        response.messages.forEach((msg) => {
          if (msg.text) {
            addMessage({ sender: 'ai', text: msg.text });
          }

          if (msg.serverContent?.turnComplete) {
            addMessage({ sender: 'system', text: 'AI turn complete.' });
            // Optionally, do something when AI turn is fully complete, e.g., enable input again
          }
        });
      });

      // Optional: Acknowledge inputs if the client needs immediate feedback that data was received
      socket.on('textInputBuffered', (ack: { sessionId: string; success: boolean }) => {
        console.debug(`Text input buffered ACK for session ${ack.sessionId}: ${ack.success}`, ack);
      });

      socket.on('audioInputBuffered', (ack: { sessionId: string; success: boolean }) => {
        console.debug(`Audio input buffered ACK for session ${ack.sessionId}: ${ack.success}`);
      });

      socket.on('error', (err: { message: string }) => {
        setError(`Socket error: ${err.message}`);
        setGeminiError(`Socket error: ${err.message}`);
        setSessionStatus('error');
        console.error('Socket emitted error:', err.message);
      });

      socketRef.current = socket;
    },
    [getAuthToken, user?.id], // Dependency array updated, currentSessionId removed as it's set by sessionStarted
  );

  const disconnectSocket = useCallback(() => {
    if (!socketRef.current || !currentSessionId) return; // Ensure currentSessionId exists before attempting to close

    console.log(`Emitting endLiveSession for ${currentSessionId} and disconnecting socket`);
    const endPayload: LiveEndSessionDto = { sessionId: currentSessionId };
    socketRef.current.emit('endLiveSession', endPayload);
    socketRef.current.disconnect();
    socketRef.current = null;

    setSocketConnected(false);
    setSessionStatus('disconnected');
    geminiLiveStore.setKey('currentConversationId', null); // Clear session ID
    geminiLiveStore.setKey('conversationHistory', []); // Clear history
    // setAudioPlaybackUrl(null); // Removed
    setGeminiError(null);
  }, [currentSessionId]);

  const sendAudioChunk = useCallback(
    (chunk: ArrayBuffer, mimeType: string) => {
      if (
        !socketRef.current ||
        !socketConnected ||
        sessionStatus !== 'active' ||
        !currentSessionId
      ) {
        console.warn('Cannot send audio chunk: socket not ready or session not active.');
        return;
      }

      // Convert ArrayBuffer to Base64 (browser-safe method)
      const bytes = new Uint8Array(chunk);
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const audioBase64 = btoa(binary);

      const payload: LiveAudioInputDto = {
        sessionId: currentSessionId,
        audioChunk: audioBase64,
        mimeType,
      };

      socketRef.current.emit('audioInput', payload);
      // User's audio input is not added to LiveMessage history here directly, as it's just a chunk.
      // The full user input will implicitly be part of the `processTurn` and AI response.
    },
    [socketConnected, sessionStatus, currentSessionId], // Added currentSessionId to dependencies
  );

  const sendTextMessage = useCallback(
    (text: string) => {
      if (
        !socketRef.current ||
        !socketConnected ||
        sessionStatus !== 'active' ||
        !currentSessionId
      ) {
        console.warn('Cannot send text message: socket not ready or session not active.');
        return;
      }

      const payload: LiveTextInputDto = {
        sessionId: currentSessionId,
        text,
      };

      socketRef.current.emit('textInput', payload); // Use 'textInput' event
      addMessage({ sender: 'user', text }); // Add user's message to history immediately for UX
    },
    [socketConnected, sessionStatus, currentSessionId], // Added currentSessionId to dependencies
  );

  /**
   * Triggers the AI to process all buffered inputs for the current turn.
   * This should be called by the client when the user has finished their input for a turn.
   */
  const processTurn = useCallback(() => {
    if (!socketRef.current || !socketConnected || sessionStatus !== 'active' || !currentSessionId) {
      console.warn('Cannot process turn: socket not ready or session not active.');
      return;
    }

    const payload: ProcessTurnDto = {
      sessionId: currentSessionId,
    };
    socketRef.current.emit('processTurn', payload);
    addMessage({ sender: 'system', text: 'Waiting for AI response...' });
  }, [socketConnected, sessionStatus, currentSessionId]); // Added currentSessionId to dependencies

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        console.log('Component unmounted, disconnecting socket.');
        socketRef.current.disconnect();
      }
    };
  }, []);

  return {
    connectSocket,
    disconnectSocket,
    sendAudioChunk,
    sendTextMessage,
    processTurn, // Expose new function
    sessionActive: sessionStatus === 'active',
    socketConnected,
    error,
    currentSessionId,
  };
};

export default useGeminiLiveSocket;

// --- Helper function (kept for reference, but likely not used for AI audio output in this setup) ---
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const binaryString = atob(base64); // `atob` is a browser global
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
};
