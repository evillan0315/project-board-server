import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { startAudioRecording, stopAudioRecording, playAudio } from '../utils/audioUtils';
import {
  setConnected,
  startRecording as startRecordingStore,
  stopRecording as stopRecordingStore,
  appendMessage,
  setAiSpeaking,
  setConversationId,
  setError,
  setIsLoading,
  resetLiveInteraction,
  updateLastMessageTypingStatus,
  liveStore,
} from '../stores/liveStore';
import {
  StartLiveSessionDto, // Renamed from StartLiveSessionPayload
  AudioInputDto, // Renamed from AudioInputPayload
  AiResponseDto, // Renamed from GeminiLiveResponse
  SessionStartedMessage, // For sessionStarted event payload
  ServerConnectedMessage, // For connected event payload
} from '../types/websocket';

interface UseLiveSocketOptions {
  websocketUrl: string;
}

export const useLiveSocket = ({ websocketUrl }: UseLiveSocketOptions) => {
  const socketRef = useRef<Socket | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingAudioRef = useRef<boolean>(false);
  const audioMimeTypeRef = useRef<string>('audio/wav'); // To store the MIME type of incoming audio

  const processAudioQueue = useCallback(async () => {
    if (audioQueueRef.current.length === 0 || isPlayingAudioRef.current) {
      if (audioQueueRef.current.length === 0) {
        // Only set AI speaking to false if the queue is truly empty and nothing is currently playing
        setAiSpeaking(false);
        updateLastMessageTypingStatus('ai', false); // AI is done speaking and responding
      }
      return;
    }

    isPlayingAudioRef.current = true;
    setAiSpeaking(true);
    const audioBase664 = audioQueueRef.current.shift();
    const mimeType = audioMimeTypeRef.current; // Use the stored MIME type

    if (audioBase664) {
      try {
        await playAudio(audioBase664, mimeType);
      } catch (error) {
        console.error('Error playing audio chunk:', error);
        setError('Error playing AI audio.');
      } finally {
        isPlayingAudioRef.current = false;
        // Recursively call to process next chunk
        processAudioQueue();
      }
    }
  }, []);

  const connectSocket = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      console.log('Socket already connected, skipping reconnection.');
      return; // Already connected
    }

    console.log(`Connecting to WebSocket at ${websocketUrl}...`);
    const socket = io(websocketUrl, { transports: ['websocket'], forceNew: true });
    socketRef.current = socket;
    setIsLoading(true);

    socket.on('connect', () => {
      console.log('Socket Connected');
      setConnected(true);
      setError(null);
      setIsLoading(false);
    });

    socket.on('sessionStarted', (data: SessionStartedMessage) => {
      // Use SessionStartedMessage DTO
      console.log('Live session started:', data.conversationId, data.message);
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }
      setIsLoading(false);
    });

    socket.on('aiResponse', async (data: AiResponseDto) => {
      // Use AiResponseDto DTO
      console.log('AI Response:', data);
      switch (data.type) {
        case 'transcription':
          // Append user's transcribed speech, mark as typing/in-progress
          if (data.text) {
            appendMessage('user', data.text, true);
          }
          break;
        case 'text':
          // Append AI's text response (likely before audio is ready for full turn)
          if (data.text) {
            appendMessage('ai', data.text, true); // AI is generating text
          }
          break;
        case 'audio':
          if (data.audioBase64 && data.audioMimeType) {
            audioQueueRef.current.push(data.audioBase64);
            audioMimeTypeRef.current = data.audioMimeType;
            processAudioQueue(); // Trigger processing
          }
          break;
        case 'turnComplete':
          console.log('AI turn complete from server.');
          // Mark both user and AI last messages as not typing.
          // AI speaking state will be managed by audio queue.
          updateLastMessageTypingStatus('user', false);
          updateLastMessageTypingStatus('ai', false);
          break;
        case 'error':
          if (data.text) {
            setError(`AI Error: ${data.text}`);
            setAiSpeaking(false);
            updateLastMessageTypingStatus('ai', false);
          }
          break;
        default:
          console.warn('Unknown AI response type:', data.type);
      }
    });

    socket.on('sessionEnded', (data: { conversationId?: string; message: string }) => {
      // Backend sends simple object for this
      console.log('Session Ended:', data.message);
      // No full reset here, as disconnect handler will do it.
      // Just update conversationId to null if it was the session that ended.
      if (
        data.conversationId === socketRef.current?.id ||
        data.conversationId === liveStore.get().conversationId
      ) {
        setConversationId(null);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket Disconnected:', reason);
      setConnected(false);
      setError(`Disconnected: ${reason}`);
      stopAudioRecording();
      setAiSpeaking(false);
      isPlayingAudioRef.current = false;
      audioQueueRef.current = [];
      // No resetLiveInteraction here, as `handleReset` in component takes care of it
      // or simply rely on state changes from disconnect.
    });

    socket.on('connect_error', (err) => {
      console.error('Socket Connection Error:', err.message);
      setError(`Connection error: ${err.message}`);
      setConnected(false);
      setIsLoading(false);
    });
  }, [websocketUrl, processAudioQueue]);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      console.log('Manually disconnecting socket...');
      socketRef.current.emit('endLiveSession');
      socketRef.current.disconnect();
      socketRef.current = null;
      stopAudioRecording();
      resetLiveInteraction(); // Full reset on manual disconnect
      audioQueueRef.current = [];
      isPlayingAudioRef.current = false;
      setAiSpeaking(false);
    }
  }, []);

  // This function initiates the live session on the backend, potentially with an initial prompt
  const startLiveSession = useCallback((initialPrompt?: string) => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.error('Socket not connected when trying to start live session.');
      setError('Socket not connected. Please wait or refresh.');
      return;
    }
    setIsLoading(true);
    const currentConversationId = liveStore.get().conversationId; // Get current conversationId from store

    const payload: StartLiveSessionDto = {
      initialPrompt,
      conversationId: currentConversationId || undefined, // Send existing ID or undefined for new
    };
    socketRef.current.emit('startLiveSession', payload);
    console.log('Emitted startLiveSession with:', payload);
  }, []);

  const startLiveRecording = useCallback(async (existingConversationId: string) => {
    if (!socketRef.current || !socketRef.current.connected) {
      setError('Socket not connected. Please try again.');
      return;
    }

    startRecordingStore(); // Update frontend recording state
    try {
      await startAudioRecording({
        onData: (audioChunk, mimeType) => {
          const payload: AudioInputDto = {
            audioChunk,
            mimeType,
            conversationId: existingConversationId, // Always send with current conversation ID
          };
          socketRef.current?.emit('audioInput', payload);
        },
        onError: (err) => {
          console.error('Recording error:', err);
          setError(`Recording error: ${err.message}`);
          stopRecordingStore();
        },
      });
      console.log('MediaRecorder started successfully.');
    } catch (err: any) {
      console.error('Failed to start media recorder:', err);
      setError(`Failed to start recording: ${err.message}`);
      stopRecordingStore();
    }
  }, []);

  const stopLiveRecording = useCallback(() => {
    stopAudioRecording();
    stopRecordingStore();
  }, []);

  useEffect(() => {
    connectSocket();

    return () => {
      disconnectSocket();
    };
  }, [connectSocket, disconnectSocket]);

  return { startLiveRecording, stopLiveRecording, disconnectSocket, startLiveSession };
};
