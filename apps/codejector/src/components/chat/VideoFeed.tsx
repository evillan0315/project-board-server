/**
 * @file React component to display a single video stream.
 */

import React, { useRef, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, useTheme } from '@mui/material';
import { VideoFeedProps } from './types';

/**
 * Renders a single video stream, either local or remote.
 * Handles attaching the MediaStream to a <video> element.
 */
const VideoFeed: React.FC<VideoFeedProps> = ({ stream, muted = false, peerId, isLocal = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const theme = useTheme();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      // Play automatically, but also handle potential browser autoplay policies
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current) {
          videoRef.current.play().catch(e => console.warn("Autoplay prevented", e));
        }
      };
    }
  }, [stream]);

  const videoContainerSx = {
    position: 'relative',
    width: '100%',
    //paddingTop: '75%', // 4:3 aspect ratio (or adjust for 16:9, e.g., '56.25%')
    backgroundColor: theme.palette.grey[900],
    borderRadius: '8px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const videoElementSx = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: isLocal ? 'scaleX(-1)' : 'none', // Mirror local video
  };

  return (
    <Paper elevation={3} sx={videoContainerSx} className="shadow-lg">
      {stream ? (
        <video ref={videoRef} muted={muted} autoPlay playsInline sx={videoElementSx} />
      ) : (
        <Box className="flex flex-col items-center justify-center h-full">
          <CircularProgress color="secondary" size={40} />
          <Typography variant="subtitle1" color="textSecondary" mt={2}>
            {isLocal ? 'Waiting for local media...' : `Waiting for ${peerId || 'peer'}...`}
          </Typography>
        </Box>
      )}
      <Box
        className="absolute bottom-2 left-2 px-2 py-1 rounded-md"
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          zIndex: 1,
        }}
      >
        <Typography variant="caption">
          {isLocal ? 'You' : `Peer ${peerId?.substring(0, 8) || 'Unknown'}`}
        </Typography>
      </Box>
    </Paper>
  );
};

export default VideoFeed;
