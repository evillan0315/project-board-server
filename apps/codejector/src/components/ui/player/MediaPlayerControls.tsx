import React, { useCallback, SyntheticEvent } from 'react';
import {
  Box,
  IconButton,
  useTheme,
  CircularProgress,
  Tooltip,
  Slider,
  Typography,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  Shuffle,
  Repeat,
  RepeatOne,
  Transcribe,
} from '@mui/icons-material';
import { useStore } from '@nanostores/react';
import {
  isPlayingAtom,
  nextTrack,
  previousTrack,
  toggleShuffle,
  toggleRepeat,
  repeatModeAtom,
  shuffleAtom,
  $mediaStore,
  setPlaying,
  showTranscriptionAtom,
  toggleShowTranscription,
  progressAtom,
  durationAtom,
  setTrackProgress,
  currentTrackAtom,
} from '@/stores/mediaStore';
import MediaPlayerVolumeControl from './MediaPlayerVolumeControl'; // Added import

// Define styles outside the component for memoization and clean JSX
const progressContainerStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  width: '100%',
};

const progressSliderStyles = (theme: any) => ({
  color: theme.palette.primary.main,
  height: 3,
  '& .MuiSlider-thumb': {
    width: 8,
    height: 8,
  },
});

// Helper function to format time
const formatTime = (time: number): string => {
  if (isNaN(time) || time === Infinity) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

interface MediaPlayerControlsProps {
  // mediaElementRef is no longer directly used in this component after removing the progress slider.
  // All playback controls interact with the global media element via the mediaStore.
  // The prop itself is now entirely removed for cleaner interface.
}

const MediaPlayerControls: React.FC<MediaPlayerControlsProps> = () => {
  const theme = useTheme();
  const { isFetchingMedia, mediaElement } = useStore($mediaStore); // Corrected: use isFetchingMedia
  const isPlaying = useStore(isPlayingAtom);
  const shuffle = useStore(shuffleAtom);
  const repeatMode = useStore(repeatModeAtom);
  const showTranscription = useStore(showTranscriptionAtom);
  const trackProgress = useStore(progressAtom);
  const duration = useStore(durationAtom);
  const currentTrack = useStore(currentTrackAtom);

  const handlePlayPause = () => {
    setPlaying(!isPlaying);
  };

  const handleNext = () => {
    nextTrack();
  };

  const handlePrevious = () => {
    previousTrack();
  };

  const handleToggleTranscription = () => {
    toggleShowTranscription();
  };

  const handleTrackTimeChange = useCallback((_event: Event, newValue: number | number[]) => {
    const newTime = typeof newValue === 'number' ? newValue : 0;
    if (mediaElement) {
      mediaElement.currentTime = newTime;
      setTrackProgress(newTime); // Update store immediately for visual feedback
    }
  }, [mediaElement, setTrackProgress]);

  const handleTrackTimeChangeCommitted = useCallback(
    (_event: Event | SyntheticEvent, newValue: number | number[]) => {
      const newTime = typeof newValue === 'number' ? newValue : 0;
      if (mediaElement) {
        mediaElement.currentTime = newTime;
        setTrackProgress(newTime); // Ensure store is updated after commit
      }
    },
    [mediaElement, setTrackProgress],
  );

  const isPlayerDisabled = !currentTrack || !mediaElement || isFetchingMedia; // Corrected: use isFetchingMedia

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row', // Changed to row to accommodate volume control
        alignItems: 'center',
        flexGrow: 1,
        width: 'auto',
        justifyContent: 'space-between', // Distribute space between volume and main controls
        px: { xs: 1, sm: 2 }, // Added padding for better spacing
      }}
    >
      {/* Volume control, aligned to the left within MediaPlayerControls */}
     

      {/* Existing playback controls (buttons and progress bar), now grouped */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flexGrow: 1,
          maxWidth: '400px', // Limit width to prevent stretching too much
          mx: 2, // Horizontal margin to separate from volume control
        }}
      >
         
        {/* Control buttons row */}
        <Box className='flex items-center justify-center gap-2 mt-1'>
          <MediaPlayerVolumeControl />
          <Tooltip title="Shuffle">
            <IconButton
              size="small"
              sx={{ color: theme.palette.text.primary }}
              onClick={toggleShuffle}
              disabled={isPlayerDisabled}
            >
              <Shuffle fontSize="small" color={shuffle ? 'primary' : 'inherit'} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Previous Track">
            <IconButton
              size="small"
              sx={{ color: theme.palette.text.primary }}
              onClick={handlePrevious}
              disabled={isPlayerDisabled}
            >
              <SkipPrevious fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
            <IconButton
              size="small"
              onClick={handlePlayPause}
              disabled={isPlayerDisabled}
              sx={{
                color: theme.palette.text.primary,
                bgcolor: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                },
                borderRadius: '50%',
              }}
            >
              {isFetchingMedia ? ( // Corrected: use isFetchingMedia
                <CircularProgress size={20} color="inherit" />
              ) : isPlaying ? (
                <Pause fontSize="small" />
              ) : (
                <PlayArrow fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="Next Track">
            <IconButton
              size="small"
              sx={{ color: theme.palette.text.primary }}
              onClick={handleNext}
              disabled={isPlayerDisabled}
            >
              <SkipNext fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={
              repeatMode === 'off'
                ? 'Repeat All'
                : repeatMode === 'context'
                  ? 'Repeat One'
                  : 'Repeat Off'
            }
          >
            <IconButton
              size="small"
              sx={{ color: theme.palette.text.primary }}
              onClick={toggleRepeat}
              disabled={isPlayerDisabled}
            >
              {repeatMode === 'track' ? (
                <RepeatOne fontSize="small" color="primary" />
              ) : (
                <Repeat
                  fontSize="small"
                  color={repeatMode === 'context' ? 'primary' : 'inherit'}
                />
              )}
            </IconButton>
          </Tooltip>
          {/* New Transcription Toggle Button */}
          <Tooltip title="Toggle Transcription">
            <IconButton
              size="small"
              sx={{ color: theme.palette.text.primary }}
              onClick={handleToggleTranscription}
              disabled={isPlayerDisabled}
            >
              <Transcribe
                fontSize="small"
                color={showTranscription ? 'primary' : 'inherit'}
              />
            </IconButton>
          </Tooltip>
        </Box>
        
      </Box>
      {/* Progress Slider (Moved here) */}
        <Box sx={progressContainerStyles} className="w-full flex items-start gap-2">
          <Typography variant="caption" color="text.secondary">
            {formatTime(trackProgress)}
          </Typography>
          <Slider
            size="small"
            value={trackProgress ?? 0}
            onChange={handleTrackTimeChange}
            onChangeCommitted={handleTrackTimeChangeCommitted}
            min={0}
            max={duration ?? 0}
            aria-label="Track progress"
            sx={progressSliderStyles(theme)}
            disabled={isPlayerDisabled}
            className="flex-grow"
          />
          <Typography variant="caption" color="text.secondary">
            {formatTime(duration)}
          </Typography>
        </Box>
    </Box>
  );
};

export default MediaPlayerControls;
