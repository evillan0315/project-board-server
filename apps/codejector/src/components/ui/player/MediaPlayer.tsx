import React from 'react';
import { Box, useTheme, Paper } from '@mui/material';
import MediaPlayerControls from './MediaPlayerControls';
import MediaPlayerTrackInfo from './MediaPlayerTrackInfo';
import AudioVisualizer from './AudioVisualizer'; // New import
import { MediaFileResponseDtoUrl, FileType } from '@/types/refactored/media';
import { useStore } from '@nanostores/react';
import {
  isPlayingAtom,
  currentTrackAtom,
  nextTrack,
  previousTrack,
  $mediaStore // Added to get mediaElement directly
} from '@/stores/mediaStore';

interface MediaPlayerProps {
  mediaElementRef: React.RefObject<HTMLMediaElement>;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({
  mediaElementRef, // Still kept as a prop but not used directly in this component anymore
}) => {
  const theme = useTheme();
  const isPlaying = useStore(isPlayingAtom);
  const currentTrack = useStore(currentTrackAtom);
  const { mediaElement } = useStore($mediaStore); // Get mediaElement from store

  const handleNext = () => {
    nextTrack();
  };

  const handlePrevious = () => {
    previousTrack();
  };

  return (
    <Box
      sx={{
        bgcolor: theme.palette.background.paper,
        borderTop: theme.palette.divider,
        height: '48px', // Increased height to accommodate visualizer
        maxWidth: '600px',
        display: 'flex',
        flexDirection: 'column', // Changed to column for stacking
        alignItems: 'center',
        justifyContent: 'space-between',
        color: theme.palette.text.primary,
        flexShrink: 0,
        zIndex: 11,
        width: '100%',
        px: 2,
      }}
    >


      {/* Track Info and Controls row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          // Allow this row to take available space and push content apart
        }}
      >
        
        <MediaPlayerTrackInfo />
        <MediaPlayerControls />
              {/* Visualizer at the top (only for audio files) */}
 
       <Box>
         <AudioVisualizer />
      </Box>
 
      </Box>
    </Box>
  );
};

export default MediaPlayer;
