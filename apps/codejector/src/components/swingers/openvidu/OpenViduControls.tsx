import React from 'react';
import { Box, Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';

import { IOpenViduPublisher } from '@/components/swingers/types';

// --- Interfaces ---
interface OpenViduControlsProps {
  isCameraActive: boolean;
  toggleCamera: () => void;
  isMicActive: boolean;
  toggleMic: () => void;
  publisher: IOpenViduPublisher | null; // Publisher is now always passed from the hook
}

// --- Styles --- //
const controlsContainerSx = {
  display: 'flex',
  justifyContent: 'center',
  gap: '16px',
  marginTop: '16px',
};

export const OpenViduControls: React.FC<OpenViduControlsProps> = ({
  isCameraActive,
  toggleCamera,
  isMicActive,
  toggleMic,
  publisher,
}) => {
  return (
    <Box sx={controlsContainerSx}>
      <Button
        variant="contained"
        color={isCameraActive ? 'primary' : 'secondary'}
        onClick={toggleCamera}
        startIcon={isCameraActive ? <VideocamIcon /> : <VideocamOffIcon />}
        disabled={!publisher} // Only disable if no publisher (e.g., media not acquired)
      >
        {isCameraActive ? 'Camera ON' : 'Camera OFF'}
      </Button>
      <Button
        variant="contained"
        color={isMicActive ? 'primary' : 'secondary'}
        onClick={toggleMic}
        startIcon={isMicActive ? <MicIcon /> : <MicOffIcon />}
        disabled={!publisher} // Only disable if no publisher (e.g., media not acquired)
      >
        {isMicActive ? 'Mic ON' : 'Mic OFF'}
      </Button>
    </Box>
  );
};
