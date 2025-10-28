import React, { useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  CircularProgress,
  Typography,
  Alert,
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import CallIcon from '@mui/icons-material/Call';

import { useOpenViduSession } from '@/components/swingers/hooks/useOpenViduSession';
import { hideDialog } from '@/stores/dialogStore';
import { OpenViduVideoRenderer } from '@/components/swingers/openvidu/OpenViduVideoRenderer'; // Import the renderer

interface RoomConnectionDialogProps {
  roomId?: string; // Optional: If provided, connect to this specific room
  onSuccess?: () => void; // Optional callback on successful connection
  connectionRole?: 'PUBLISHER' | 'SUBSCRIBER'; // NEW: Role for the connection
}

// No longer directly renders a Dialog, just its content.
// Padding for this content is now handled by this component itself, as GlobalDialog's DialogContent has p:0.

export const RoomConnectionDialog: React.FC<RoomConnectionDialogProps> = ({
  roomId,
  onSuccess,
  connectionRole = 'PUBLISHER', // Default to PUBLISHER
}) => {
  const {
    sessionNameInput,
    handleSessionNameChange,
    joinSession,
    leaveSession,
    initLocalMediaPreview, // NEW
    destroyLocalMediaPreview, // NEW
    toggleCamera,
    toggleMic,
    isCameraActive,
    isMicActive,
    isLoading,
    error,
    publisher, // NEW: Expose publisher for preview
    currentSessionId, // NEW: Expose current session ID to know if already connected
    openViduInstance, // NEW: Expose OpenVidu instance to guard useEffect
  } = useOpenViduSession(roomId, connectionRole); // Pass roomId and connectionRole to hook

  // Effect to initialize and destroy local media preview
  useEffect(() => {
    // Only initialize if OpenVidu instance is ready AND if the role is PUBLISHER
    if (connectionRole === 'PUBLISHER' && openViduInstance) {
      initLocalMediaPreview(); // Start local media acquisition when dialog mounts

      return () => {
        destroyLocalMediaPreview(); // Stop and destroy publisher when dialog unmounts
      };
    } else if (connectionRole === 'SUBSCRIBER') {
      // Ensure no publisher is active if switching to SUBSCRIBER role
      destroyLocalMediaPreview();
    }
    // No cleanup for subscriber role here, as initLocalMediaPreview won't be called
    // and the main cleanup in useOpenViduSession handles it.
  }, [initLocalMediaPreview, destroyLocalMediaPreview, openViduInstance, connectionRole]);


  const handleConnect = useCallback(async () => {
    // If already connected, do nothing or show a message
    if (currentSessionId && currentSessionId === sessionNameInput) {
        console.warn(`Already connected to session: ${sessionNameInput}`);
        hideDialog();
        return;
    }

    if (!sessionNameInput) {
      console.error('Session name is required to connect.');
      return;
    }
    try {
      await joinSession(sessionNameInput);
      onSuccess && onSuccess();
      //hideDialog(); // Close dialog on success
    } catch (e) {
      console.error('Failed to connect to room:', e);
      // Error feedback is handled by useOpenViduSession's error state
    }
  }, [sessionNameInput, joinSession, onSuccess, hideDialog, currentSessionId]);

  const handleLeave = useCallback(async () => {
    await leaveSession();
    // After leaving, if still in dialog, re-init preview for potential re-connection
    if (connectionRole === 'PUBLISHER') {
      initLocalMediaPreview();
    }
  }, [leaveSession, initLocalMediaPreview, connectionRole]);

  // Determine if already connected to this room
  const isCurrentlyConnected = !!currentSessionId && currentSessionId === sessionNameInput;

  return (
    <Box
      sx={{
        p: 2, // Add padding here directly for the content within GlobalDialog's DialogContent
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        alignItems: 'center',
      }}
    >
      {/* Title and main descriptive text are handled by GlobalDialog. */}
      {/* Keeping specific instructional text here. */}
      <Typography variant="h6" component="div" color="text.primary" className="font-bold">
        {roomId ? `Connect to Room: ${roomId}` : 'Configure & Connect to Room'}
      </Typography>
      <Typography color="text.secondary">
        {connectionRole === 'PUBLISHER'
          ? 'Configure your camera and microphone before joining the session.'
          : 'Connect as a viewer to see available streams.'}
      </Typography>

      {error && (
        <Alert severity="error" className="w-full">
          {error}
        </Alert>
      )}

      {/* Local Video Preview and Controls for PUBLISHER role only */}
      {connectionRole === 'PUBLISHER' && (
        <>
          <Box className="w-full max-w-sm rounded-lg overflow-hidden shadow-lg border border-gray-700 aspect-video bg-black flex items-center justify-center">
            {publisher ? (
              <OpenViduVideoRenderer streamManager={publisher} isLocal={true} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                {isLoading ? 'Loading media...' : 'No media preview available'}
              </Typography>
            )}
          </Box>

          {/* Controls for Camera/Mic */}
          <Box className="flex gap-4 justify-center w-full">
            <Button
              variant="contained"
              color={isCameraActive ? 'primary' : 'secondary'}
              onClick={toggleCamera}
              startIcon={isCameraActive ? <VideocamIcon /> : <VideocamOffIcon />}
              disabled={isLoading && !publisher} // Disable only if loading AND no publisher yet
            >
              {isCameraActive ? 'Camera ON' : 'Camera OFF'}
            </Button>
            <Button
              variant="contained"
              color={isMicActive ? 'primary' : 'secondary'}
              onClick={toggleMic}
              startIcon={isMicActive ? <MicIcon /> : <MicOffIcon />}
              disabled={isLoading && !publisher} // Disable only if loading AND no publisher yet
            >
            {isMicActive ? 'Mic ON' : 'Mic OFF'}
            </Button>
          </Box>
        </>
      )}

      {/* Session Name Input */}
      {!roomId && (
        <TextField
          label="Session Name (Room ID)"
          variant="outlined"
          value={sessionNameInput}
          onChange={handleSessionNameChange}
          fullWidth
          disabled={isLoading || isCurrentlyConnected}
          margin="normal"
        />
      )}

      {/* Action Buttons */}
      <Box className="flex gap-4 justify-end w-full mt-4">
        <Button
          variant="outlined"
          color="error"
          onClick={handleLeave}
          disabled={isLoading || !currentSessionId} // Disable if loading or not connected to any session
          startIcon={<CallEndIcon />}
        >
          Leave Session
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleConnect}
          disabled={isLoading || !sessionNameInput || isCurrentlyConnected} // Disable if loading, no session name, or already connected
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <CallIcon />}
        >
          {isLoading ? 'Connecting...' : (isCurrentlyConnected ? 'Connected' : 'Connect to Room')}
        </Button>
      </Box>
    </Box>
  );
};
