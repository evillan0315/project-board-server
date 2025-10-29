import React, { useCallback } from 'react';
import { Box, useTheme, Paper } from '@mui/material';
import MediaPlayerControls from './MediaPlayerControls';
import MediaPlayerTrackInfo from './MediaPlayerTrackInfo';
import AudioVisualizer from './AudioVisualizer'; // New import
import { TranscriptionHighlight } from '@/components/TranscriptionPlayer/TranscriptionHighlight'; // Import TranscriptionHighlight
import { FileType } from '@/types/refactored/media';
import { useStore } from '@nanostores/react';
import {
  isPlayingAtom,
  currentTrackAtom,
  nextTrack,
  previousTrack,
  $mediaStore, // Added to get mediaElement directly
  showTranscriptionAtom, // New import
  transcriptionResultAtom, // New import
  transcriptionSyncDataAtom, // New import
  progressAtom, // New import
} from '@/stores/mediaStore';

interface MediaPlayerProps {
  // mediaElementRef is removed as mediaElement is accessed via store
}

const MediaPlayer: React.FC<MediaPlayerProps> = () => {
  const theme = useTheme();
  const isPlaying = useStore(isPlayingAtom);
  const currentTrack = useStore(currentTrackAtom);
  const { mediaElement } = useStore($mediaStore); // Get mediaElement from store
  const showTranscription = useStore(showTranscriptionAtom); // Get state
  const transcriptionResult = useStore(transcriptionResultAtom); // Get state
  const transcriptionSyncData = useStore(transcriptionSyncDataAtom); // Get state
  const trackProgress = useStore(progressAtom); // Get state

  const handleNext = () => {
    nextTrack();
  };

  const handlePrevious = () => {
    previousTrack();
  };

  // New seek function for TranscriptionHighlight
  const handleTranscriptionSeek = useCallback(
    (time: number) => {
      if (mediaElement) {
        mediaElement.currentTime = time;
      }
    },
    [mediaElement],
  );

  const isAudioTrack = currentTrack?.fileType === FileType.AUDIO;
  const isTranscriptionAvailable = !!transcriptionResult?.segments?.length;

  return (
    <Box
      sx={{
        bgcolor: theme.palette.background.paper,
        borderTop: theme.palette.divider,
        // Removed fixed height, now dynamic based on content
        display: 'flex',
        flexDirection: 'column', // Main container is a column
        alignItems: 'start',
        color: theme.palette.text.primary,
        flexShrink: 0,
        zIndex: 11,
        width: '100%',
        px: 2,
        // Added minHeight to ensure it doesn't collapse
        minHeight: '48px', // Base height for controls
      }}
      className='flex-grow-0' // Ensure it doesn't grow unnecessarily in a flex parent
    >
      {/* Top row for track info and player controls */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          //justifyContent: 'space-between',
          py: 0.5, // Small padding top/bottom for this row
        }}
      >
        <MediaPlayerTrackInfo />
        <MediaPlayerControls />
              {/* Audio Visualizer (conditionally rendered below controls) */}
      {isAudioTrack && isPlaying && ( // Only show visualizer if it's an audio track AND playing

          <AudioVisualizer />
      
      )}
      </Box>



      {/* Transcription Highlight (conditionally rendered below visualizer/controls) */}
      {showTranscription && isTranscriptionAvailable && transcriptionSyncData && (
        <Paper
          elevation={1}
          sx={{
            width: '100%',
            maxWidth: '40%',
            p: 1,
            mt: 1, // Margin top to separate from controls/visualizer
            mb: 0.5,
            bgcolor: 'background.default', // Slightly different background for transcription area
            overflowY: 'auto', // Enable scrolling if transcription is long
            maxHeight: '200px', // Limit height to prevent taking too much space    
            border: `1px solid ${theme.palette.divider}`,
          }}
          className='fixed bottom-13 left-2 z-1000'
        >
          <TranscriptionHighlight
            syncData={transcriptionSyncData}
            currentTime={trackProgress}
            fullTranscription={transcriptionResult}
            onSeek={handleTranscriptionSeek}
          />
        </Paper>
      )}
    </Box>
  );
};

export default MediaPlayer;
