/**
 * @file React component for video chat controls (mute/unmute audio/video, hang up).
 */

import React from 'react';
import { Box, IconButton, Tooltip, useTheme } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';

import { VideoControlsProps } from './types';

/**
 * Provides controls for a video chat, including mute/unmute for audio/video
 * and a hang-up button.
 */
const VideoControls: React.FC<VideoControlsProps> = ({
  isAudioMuted,
  isVideoMuted,
  onToggleAudio,
  onToggleVideo,
  onHangUp,
}) => {
  const theme = useTheme();

  return (
    <Box
      className="flex justify-center items-center p-4 gap-4"
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Tooltip title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}>
        <IconButton onClick={onToggleAudio} color={isAudioMuted ? 'error' : 'primary'}>
          {isAudioMuted ? <MicOffIcon fontSize="large" /> : <MicIcon fontSize="large" />}
        </IconButton>
      </Tooltip>
      <Tooltip title={isVideoMuted ? 'Unmute Video' : 'Mute Video'}>
        <IconButton onClick={onToggleVideo} color={isVideoMuted ? 'error' : 'primary'}>
          {isVideoMuted ? <VideocamOffIcon fontSize="large" /> : <VideocamIcon fontSize="large" />}
        </IconButton>
      </Tooltip>
      <Tooltip title="End Call">
        <IconButton onClick={onHangUp} color="error">
          <CallEndIcon fontSize="large" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default VideoControls;
