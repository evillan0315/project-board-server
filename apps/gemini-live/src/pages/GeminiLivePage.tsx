import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import { geminiLiveStore } from '@/stores/geminiLiveStore';
import useAudioRecorder from '@/hooks/useAudioRecorder';
import useGeminiLiveSocket from '@/hooks/useGeminiLiveSocket';
import LiveInteraction from '@/components/LiveInteraction';
import AudioInputVisualizer from '@/components/AudioInputVisualizer';
import Webcam from 'react-webcam';

import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Switch,
  FormControlLabel,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import SendIcon from '@mui/icons-material/Send';
import StartIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';

const GeminiLivePage: React.FC = () => {
  const { isLoggedIn, loading: authLoading } = useStore(authStore);
  const { sessionStatus, conversationHistory, error: geminiError } = useStore(geminiLiveStore);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [textInput, setTextInput] = useState('');
  const [showVideo, setShowVideo] = useState(false);
  const [enableSelfPlayback, setEnableSelfPlayback] = useState(false); // New state for self-playback

  const {
    isRecording,
    toggleRecording,
    audioChunks,
    clearAudioChunks,
    error: audioError,
    mediaStream,
    mimeType: recorderMimeType, // Get the mimeType from the hook
  } = useAudioRecorder();
  const {
    connectSocket,
    disconnectSocket,
    sendAudioChunk,
    sendTextMessage,
    processTurn, // ✨ Destructure the new processTurn function
    sessionActive,
    socketConnected,
    error: socketError,
    currentSessionId, // Renamed from currentConversationId in hook
  } = useGeminiLiveSocket();

  const isSessionLoading = sessionStatus === 'connecting' || authLoading;

  // Effect to continuously send audio chunks to the socket while recording
  // `sendAudioChunk` now only buffers on the backend. `processTurn` will trigger AI.
  useEffect(() => {
    if (isRecording && sessionActive && recorderMimeType) {
      const lastChunk = audioChunks[audioChunks.length - 1];
      if (lastChunk && lastChunk.byteLength > 0) {
        sendAudioChunk(lastChunk, recorderMimeType);
        clearAudioChunks(); // Clear local chunks after sending to backend buffer
      }
    }
  }, [audioChunks, isRecording, sessionActive, sendAudioChunk, clearAudioChunks, recorderMimeType]);

  // ✨ NEW EFFECT: Trigger processTurn when audio recording stops
  useEffect(() => {
    // If recording was active and just stopped (isRecording transitions from true to false)
    // And a session is active with a valid ID, trigger processing
    if (!isRecording && sessionActive && currentSessionId) {
      // Only trigger if audio chunks were sent to the backend during the recording session
      // (i.e., we actually recorded something).
      // The `audioChunks` array might be empty here already due to `clearAudioChunks` in the other effect.
      // A more robust check might involve a `hasAudioBeenSent` flag in useAudioRecorder or useGeminiLiveSocket
      // For now, rely on `processTurn` itself to check for buffered input.
      console.log('Recording stopped and session active, triggering processTurn...');
      processTurn();
      // Optional: Clear any remaining local audio chunks or state for visualizer
      clearAudioChunks();
    }
  }, [isRecording, sessionActive, currentSessionId, processTurn, clearAudioChunks]);

  const handleStartSession = () => {
    if (!isLoggedIn) {
      alert('Please log in to start a Gemini Live session.');
      return;
    }
    // `connectSocket` itself might trigger an initial `processTurn` if `initialPrompt` is provided
    connectSocket(initialPrompt);
  };

  const handleEndSession = () => {
    disconnectSocket();
    clearAudioChunks();
    setInitialPrompt('');
    setTextInput('');
    setShowVideo(false);
    setEnableSelfPlayback(false);
    // Ensure recording is stopped if active
    if (isRecording) {
      toggleRecording(); // This will also stop the mediaStream
    }
  };

  const handleSendText = () => {
    if (textInput.trim() && sessionActive) {
      sendTextMessage(textInput);
      setTextInput('');
      processTurn(); // ✨ Call processTurn after sending text
    }
  };

  if (authLoading) {
    return (
      <Box className="flex justify-center items-center min-h-[50vh]">
        <CircularProgress />
        <Typography className="ml-2">Loading authentication status...</Typography>
      </Box>
    );
  }

  if (!isLoggedIn) {
    return (
      <Paper elevation={2} className="p-6 mt-6 bg-red-50/50 border border-red-200 text-center">
        <Typography variant="h6" className="!font-semibold !text-red-800 mb-2">
          Access Denied
        </Typography>
        <Typography variant="body1" className="text-gray-700">
          Please log in to use the Gemini Live features.
        </Typography>
      </Paper>
    );
  }

  const hasError = audioError || socketError || geminiError;

  return (
    <Box className="flex flex-col gap-6">
      <Typography variant="h4" className="!font-bold !text-gray-900 text-center">
        Gemini Live Interaction
      </Typography>

      {hasError && (
        <Alert severity="error" className="w-full">
          {hasError}
        </Alert>
      )}

      <Paper elevation={2} className="p-6 flex flex-col gap-4">
        <Typography variant="h6" className="!font-semibold">
          Session Controls
        </Typography>
        <TextField
          label="Initial Prompt (Optional)"
          value={initialPrompt}
          onChange={(e) => setInitialPrompt(e.target.value)}
          disabled={sessionActive}
          fullWidth
        />
        <Box className="flex gap-2 justify-center flex-wrap">
          {!sessionActive ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartSession}
              startIcon={<StartIcon />}
              disabled={isSessionLoading}
              sx={{ minWidth: 150 }}
            >
              {isSessionLoading ? <CircularProgress size={24} color="inherit" /> : 'Start Session'}
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="error"
              onClick={handleEndSession}
              startIcon={<StopIcon />}
              disabled={isSessionLoading}
              sx={{ minWidth: 150 }}
            >
              End Session
            </Button>
          )}

          <Button
            variant="contained"
            color={isRecording ? 'secondary' : 'primary'}
            onClick={toggleRecording}
            startIcon={isRecording ? <MicOffIcon /> : <MicIcon />}
            disabled={!sessionActive || isSessionLoading}
            sx={{ minWidth: 150 }}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>

          <IconButton
            color={showVideo ? 'secondary' : 'primary'}
            onClick={() => setShowVideo((prev) => !prev)}
            disabled={isSessionLoading}
          >
            {showVideo ? <VideocamOffIcon /> : <VideocamIcon />}
          </IconButton>

          <FormControlLabel
            control={
              <Switch
                checked={enableSelfPlayback}
                onChange={(e) => setEnableSelfPlayback(e.target.checked)}
                name="selfPlayback"
                color="primary"
                disabled={!sessionActive || isSessionLoading || !isRecording}
              />
            }
            label="Hear Own Mic"
            className="ml-4"
          />
        </Box>

        {sessionStatus === 'connecting' && (
          <Box className="flex items-center justify-center mt-2">
            <CircularProgress size={20} className="mr-2" />
            <Typography variant="body2">Connecting to AI session...</Typography>
          </Box>
        )}
        {isRecording && mediaStream && (
          <AudioInputVisualizer
            mediaStream={mediaStream}
            width={400}
            height={80}
            barColor="#1976d2"
            enableSelfPlayback={enableSelfPlayback} // Pass the new prop
          />
        )}
      </Paper>

      {showVideo && (
        <Box className="w-full relative rounded-lg overflow-hidden shadow-md">
          <Webcam
            audio={false}
            videoConstraints={{ facingMode: 'user' }}
            className="w-full h-auto object-cover"
            height={400}
          />
          <Typography
            variant="caption"
            className="absolute bottom-2 left-2 text-white bg-black/50 px-2 py-1 rounded"
          >
            Live Camera Feed (Video streaming to AI not yet implemented)
          </Typography>
        </Box>
      )}

      <LiveInteraction messages={conversationHistory} />

      <Paper elevation={2} className="p-4 flex items-center gap-2">
        <TextField
          label="Type your message..."
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleSendText();
          }}
          fullWidth
          variant="outlined"
          disabled={!sessionActive}
        />
        <Button
          variant="contained"
          onClick={handleSendText}
          endIcon={<SendIcon />}
          disabled={!sessionActive || !textInput.trim()}
        >
          Send
        </Button>
      </Paper>
    </Box>
  );
};

export default GeminiLivePage;
