import React from 'react';
import { Box, TextField, Button, CircularProgress, Alert } from '@mui/material';
import CallEndIcon from '@mui/icons-material/CallEnd';
import CallIcon from '@mui/icons-material/Call';

// --- Interfaces ---
interface OpenViduSessionFormProps {
  sessionNameInput: string;
  handleSessionNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  joinSession: (sessionId?: string) => Promise<void>;
  leaveSession: () => void;
  isLoading: boolean;
  currentSessionId: string | null;
  error: string | null;
  isRoomIdFromUrl: boolean; // New prop to indicate if roomId came from URL
  // No longer needs a publisher prop as controls are separate now.
}

// --- Styles --- //
const formContainerSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  marginBottom: '24px',
  padding: '16px',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: '8px',
  backgroundColor: 'background.paper',
  boxShadow: 1,
};

export const OpenViduSessionForm: React.FC<OpenViduSessionFormProps> = ({
  sessionNameInput,
  handleSessionNameChange,
  joinSession,
  leaveSession,
  isLoading,
  currentSessionId,
  error,
  isRoomIdFromUrl,
}) => {
  return (
    <Box sx={formContainerSx}>
      <TextField
        label="Session Name"
        variant="outlined"
        value={sessionNameInput}
        onChange={handleSessionNameChange}
        fullWidth
        disabled={isLoading || !!currentSessionId || isRoomIdFromUrl} // Disable if from URL or already connected
      />
      <Box className="flex gap-4 justify-end">
        {!currentSessionId ? (
          <Button
            variant="contained"
            color="primary"
            onClick={() => joinSession()} // Call without argument, hook handles it
            disabled={isLoading || !sessionNameInput}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <CallIcon />}
          >
            {isLoading ? 'Connecting...' : 'Join Session'}
          </Button>
        ) : (
          <Button
            variant="outlined"
            color="error"
            onClick={leaveSession}
            disabled={isLoading}
            startIcon={<CallEndIcon />}
          >
            Leave Session
          </Button>
        )}
      </Box>
    </Box>
  );
};
