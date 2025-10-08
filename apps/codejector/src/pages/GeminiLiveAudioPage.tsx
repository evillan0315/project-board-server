import React, { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  useTheme,
  TextField as MuiTextField,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SendIcon from '@mui/icons-material/Send';

import {
  geminiLiveStore,
  setIsRecording,
  setMicrophonePermissionGranted,
  appendAiResponseText,
  dequeueAiResponseAudio,
  clearAiResponseAudioQueue, // New: Import new action
  setLoading,
  setError,
  clearGeminiLiveState,
  setInitialUserText,
} from '@/stores/geminiLiveStore';
import {
  connectGeminiLive,
  disconnectGeminiLive,
  sendAudioChunk,
  processGeminiTurn,
  sendInitialTextInput,
} from '@/api/geminiLive';
import { authStore } from '@/stores/authStore';
import { debounce } from '@/utils';

interface GeminiLiveAudioPageProps {}

const MIMETYPE_AUDIO = 'audio/webm'; // Common and widely supported audio MIME type
const AUDIO_CHUNK_INTERVAL_MS = 500; // Send audio chunks every 500ms
const INACTIVITY_TIMEOUT_MS = 1500; // Trigger processTurn after 1.5s of audio inactivity

const GeminiLiveAudioPage: React.FC<GeminiLiveAudioPageProps> = () => {
  const theme = useTheme();
  const { isLoggedIn } = useStore(authStore);
  const {
    sessionId,
    isSessionActive,
    isRecording,
    microphonePermissionGranted,
    userTranscript,
    aiResponseText,
    aiResponseAudioQueue,
    currentInputText,
    loading,
    error,
  } = useStore(geminiLiveStore);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const lastAudioActivityRef = useRef<number>(Date.now());

  // Debounced function to trigger AI processing turn after inactivity
  const debouncedProcessTurn = useCallback(
    debounce(() => {
      if (sessionId && isSessionActive && audioChunksRef.current.length > 0) {
        console.log('Inactivity detected, processing turn...');
        // The service already has the mechanism to send text, then trigger waitTurn.
        // For pure audio, we send chunks, then trigger processTurn. `sendAudioChunk` just buffers.
        processGeminiTurn(sessionId);
      }
    }, INACTIVITY_TIMEOUT_MS),
    [sessionId, isSessionActive],
  );

  // --- Audio Playback Logic ---
  useEffect(() => {
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio();
      audioPlayerRef.current.onended = () => {
        // Once current audio finishes, dequeue and play the next
        dequeueAiResponseAudio();
      };
      audioPlayerRef.current.onerror = (e) => {
        console.error('Audio playback error:', e);
        dequeueAiResponseAudio(); // Skip to next audio on error
      };
    }
  }, []);

  useEffect(() => {
    if (aiResponseAudioQueue.length > 0 && audioPlayerRef.current) {
      if (audioPlayerRef.current.paused || audioPlayerRef.current.ended) {
        const audioDataUrl = aiResponseAudioQueue[0];
        // Only set src and play if audioDataUrl is not empty
        if (audioDataUrl) {
          audioPlayerRef.current.src = audioDataUrl;
          audioPlayerRef.current.play().catch((e) => {
            console.error('Failed to play audio:', e); // Line 111 (reported in error)
            // If playback fails, try the next one after a short delay
            setTimeout(() => dequeueAiResponseAudio(), 500);
          });
        } else {
          // If for some reason an empty string made it to the queue, dequeue it
          dequeueAiResponseAudio();
        }
      }
    }
  }, [aiResponseAudioQueue]);

  // --- Session & Recording Effects ---
  useEffect(
    () =>
      // Cleanup on component unmount or logout
      () => {
        stopRecording(); // Ensure recording is stopped
        if (isSessionActive) {
          disconnectGeminiLive(); // Disconnect WS if active
        }
        clearGeminiLiveState();
      },
    [isSessionActive],
  ); // Only depends on isSessionActive for cleanup

  useEffect(() => {
    if (!isLoggedIn) {
      // If user logs out, clear everything related to Gemini Live
      stopRecording();
      disconnectGeminiLive();
      clearGeminiLiveState();
    }
  }, [isLoggedIn]);

  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      setMicrophonePermissionGranted(true);
      return stream;
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setError(
        `Microphone access denied: ${err.message || 'Please grant permission.'}`,
      );
      setMicrophonePermissionGranted(false);
      return null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    if (!sessionId) {
      setError('No active session. Please start a session first.');
      return;
    }

    let stream = audioStreamRef.current;
    if (!stream) {
      stream = await requestMicrophonePermission();
      if (!stream) return; // Permission denied
    }

    // Ensure tracks are enabled
    stream.getAudioTracks().forEach((track) => (track.enabled = true));

    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: MIMETYPE_AUDIO,
    });
    audioChunksRef.current = []; // Clear previous chunks

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
        lastAudioActivityRef.current = Date.now(); // Update last activity timestamp

        // Convert Blob to Base64 and send
        const reader = new FileReader();
        reader.readAsDataURL(event.data);
        reader.onloadend = () => {
          const base64Audio = (reader.result as string).split(',')[1];
          if (sessionId && base64Audio) {
            sendAudioChunk(sessionId, base64Audio, MIMETYPE_AUDIO);
            debouncedProcessTurn(); // Trigger debounced processTurn
          }
        };
      }
    };

    mediaRecorderRef.current.onstop = () => {
      console.log('MediaRecorder stopped. Finalizing turn if needed.');
      // No explicit `processTurn` here, it's handled by debouncedProcessTurn or explicit button click
    };

    mediaRecorderRef.current.start(AUDIO_CHUNK_INTERVAL_MS);
    setIsRecording(true);
    setError(null);
    console.log('Recording started.');
  }, [
    isRecording,
    sessionId,
    requestMicrophonePermission,
    debouncedProcessTurn,
  ]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      audioStreamRef.current
        ?.getAudioTracks()
        .forEach((track) => (track.enabled = false));
      setIsRecording(false);
      debouncedProcessTurn.cancel(); // Cancel any pending debounced calls
      // Ensure any remaining buffered audio is processed one last time
      if (sessionId && audioChunksRef.current.length > 0) {
        console.log('Recording manually stopped, processing final turn.');
        processGeminiTurn(sessionId);
      }
      audioChunksRef.current = []; // Clear chunks after stopping and processing
      console.log('Recording stopped.');
    }
  }, [isRecording, sessionId, debouncedProcessTurn]);

  const handleStartSession = useCallback(() => {
    if (!isLoggedIn) {
      setError('You must be logged in to start a session.');
      return;
    }
    setLoading(true);
    setError(null);
    // Clear previous AI responses and user text for a fresh session
    appendAiResponseText('');
    setInitialUserText('');
    clearAiResponseAudioQueue(); // New: Clear audio queue using the dedicated action
    // Initial text can be provided here, e.g., from `currentInputText`
    connectGeminiLive({
      initialText: currentInputText || undefined,
    });
  }, [isLoggedIn, currentInputText]);

  const handleEndSession = useCallback(() => {
    stopRecording();
    disconnectGeminiLive();
  }, [stopRecording]);

  const handleSendText = useCallback(() => {
    if (sessionId && currentInputText.trim()) {
      sendInitialTextInput(sessionId, currentInputText.trim());
      setInitialUserText(''); // Clear input after sending
    } else if (!sessionId) {
      setError('No active session. Please start a session first.');
      // No 'n' here, likely a typo in original code
    }
  }, [sessionId, currentInputText]);

  // Render logic
  const canStartSession = !isSessionActive && isLoggedIn && !loading;
  const canEndSession = isSessionActive && !loading;
  const canStartRecording = isSessionActive && !isRecording && !loading;
  const canStopRecording = isSessionActive && isRecording && !loading;
  const canSendText =
    isSessionActive && currentInputText.trim() !== '' && !loading;

  const statusColor = isSessionActive
    ? theme.palette.success.main
    : theme.palette.error.main;
  const statusText = isSessionActive ? 'Connected' : 'Disconnected';

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        mx: 'auto',
        my: 4,
        maxWidth: '900px',
        width: '100%',
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        flexGrow: 1,
        minHeight: 'calc(100vh - 120px)',
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        sx={{
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <MicIcon sx={{ fontSize: 40 }} /> Live Audio with Gemini
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Engage in live audio conversations with Gemini AI.
      </Typography>

      {!isLoggedIn && (
        <Alert severity="warning">Please log in to use Gemini Live.</Alert>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isSessionActive ? (
            <WifiIcon sx={{ color: statusColor }} />
          ) : (
            <WifiOffIcon sx={{ color: statusColor }} />
          )}
          <Typography variant="body2" sx={{ color: statusColor }}>
            Status: {statusText}
            {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={handleStartSession}
          disabled={!canStartSession}
          startIcon={
            loading && !isSessionActive ? (
              <CircularProgress size={20} color="inherit" />
            ) : null
          }
        >
          Start Session
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={handleEndSession}
          disabled={!canEndSession}
          startIcon={
            loading && isSessionActive ? (
              <CircularProgress size={20} color="inherit" />
            ) : null
          }
        >
          End Session
        </Button>

        <Button
          variant="contained"
          color="secondary"
          onClick={startRecording}
          disabled={!canStartRecording}
          startIcon={<MicIcon />}
        >
          Start Recording
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={stopRecording}
          disabled={!canStopRecording}
          startIcon={<StopIcon />}
        >
          Stop Recording
        </Button>

        <Button
          variant="outlined"
          onClick={() => sessionId && processGeminiTurn(sessionId)}
          disabled={
            !isSessionActive ||
            isRecording ||
            loading ||
            audioChunksRef.current.length === 0
          }
          sx={{ ml: 'auto' }}
        >
          Process Turn (Manual)
        </Button>
      </Box>

      <MuiTextField
        label="Initial Text Prompt (optional)"
        fullWidth
        value={currentInputText}
        onChange={(e) => setInitialUserText(e.target.value)}
        disabled={isSessionActive || loading}
        sx={{ mb: 2 }}
        InputLabelProps={{ shrink: true }}
        InputProps={{ style: { color: theme.palette.text.primary } }}
      />

      <Button
        variant="contained"
        color="info"
        onClick={handleSendText}
        disabled={!canSendText}
        startIcon={<SendIcon />}
      >
        Send Text to AI
      </Button>

      <Box sx={{ display: 'flex', gap: 2, mt: 3, flexGrow: 1 }}>
        {/* User Input / Transcript */}
        <Paper
          sx={{
            flex: 1,
            p: 2,
            minHeight: 150,
            bgcolor: theme.palette.background.default,
            overflowY: 'auto',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold' }} gutterBottom>
            Your Input (Transcript)
          </Typography>
          <Typography whiteSpace="pre-wrap">
            {userTranscript ||
              'Speak into the microphone... (not yet transcribed client side)'}
          </Typography>
        </Paper>

        {/* AI Response */}
        <Paper
          sx={{
            flex: 1,
            p: 2,
            minHeight: 150,
            bgcolor: theme.palette.background.default,
            overflowY: 'auto',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold' }} gutterBottom>
            AI Response
          </Typography>
          <Typography whiteSpace="pre-wrap">
            {aiResponseText || 'AI responses will appear here.'}
          </Typography>
        </Paper>
      </Box>
    </Paper>
  );
};

export default GeminiLiveAudioPage;
