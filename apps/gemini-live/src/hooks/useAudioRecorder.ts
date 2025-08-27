import { useState, useRef, useCallback, useEffect } from 'react';
import 'webrtc-adapter';

export interface UseAudioRecorderResult {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  toggleRecording: () => Promise<void>;
  audioChunks: ArrayBuffer[];
  clearAudioChunks: () => void;
  getLatestChunk: () => Uint8Array | null;
  error: string | null;
  mediaStream: MediaStream | null; // New: Expose the raw MediaStream
  mimeType: string | null; // New: Expose the selected MIME type
}

// Preferred MIME types for Gemini Live (PCM/WAV recommended)
const MIME_TYPES = [
  'audio/pcm;rate=16000', // Backend expects this format for raw audio chunks
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/wav',
  'audio/ogg',
];

/**
 * Hook for recording audio and streaming chunks in real-time.
 */
const useAudioRecorder = (): UseAudioRecorderResult => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<ArrayBuffer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null); // State for MediaStream
  const [mimeType, setMimeType] = useState<string | null>(null); // State for selected MIME type

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const clearAudioChunks = useCallback(() => setAudioChunks([]), []);

  const getLatestChunk = useCallback((): Uint8Array | null => {
    if (audioChunks.length === 0) return null;
    const last = audioChunks[audioChunks.length - 1];
    return new Uint8Array(last);
  }, [audioChunks]);

  const startRecording = useCallback(async () => {
    if (isRecording) return;

    setError(null);
    clearAudioChunks();
    setMediaStream(null); // Clear previous stream
    setMimeType(null); // Clear previous mime type

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream); // Set stream for visualizer

      // Find a supported MIME type
      const selectedMimeType = MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
      if (!selectedMimeType) {
        setError('No supported audio format found in your browser.');
        stream.getTracks().forEach((track) => track.stop());
        setMediaStream(null);
        return;
      }
      setMimeType(selectedMimeType);

      const recorder = new MediaRecorder(stream, { mimeType: selectedMimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          event.data.arrayBuffer().then((buffer) => {
            setAudioChunks((prev) => [...prev, buffer]);
          });
        }
      };

      recorder.onstop = () => {
        // Stop all tracks on stop
        stream.getTracks().forEach((track) => track.stop());
        setMediaStream(null);
        setMimeType(null);
        console.log('Recording stopped');
      };

      recorder.onerror = (ev) => {
        console.error('Recording error:', ev.error);
        setError(`Recording error: ${ev.error?.name || 'Unknown'}`);
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        setMediaStream(null);
        setMimeType(null);
      };

      recorder.start(100); // 100ms chunks for real-time streaming
      setIsRecording(true);
      console.log('Recording started with MIME type:', selectedMimeType);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(`Failed to access microphone: ${(err as Error).message}`);
      setIsRecording(false);
      setMediaStream(null);
      setMimeType(null);
    }
  }, [isRecording, clearAudioChunks]);

  const stopRecording = useCallback(() => {
    if (!isRecording) return;

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    // Stream tracks are stopped in recorder.onstop handler
    // setMediaStream(null); // Ensure stream is null when stopped - this is now handled in onstop
    // setMimeType(null); // This is now handled in onstop
    setIsRecording(false);
  }, [isRecording]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
      if (mediaStream) {
        // Ensure all tracks are stopped if component unmounts while stream is active
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isRecording, stopRecording, mediaStream]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    toggleRecording,
    audioChunks,
    clearAudioChunks,
    getLatestChunk,
    error,
    mediaStream,
    mimeType, // Return the selected MIME type
  };
};

export default useAudioRecorder;
