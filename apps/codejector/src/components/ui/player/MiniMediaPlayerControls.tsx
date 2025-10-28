import React, { useCallback, SyntheticEvent } from 'react';
import {
  Box,
  IconButton,
  Slider,
  Typography,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  Shuffle,
  Repeat,
  RepeatOne,
} from '@mui/icons-material';
import { useStore } from '@nanostores/react';
import {
  isPlayingAtom,
  progressAtom,
  durationAtom,
  setTrackProgress,
  nextTrack,
  previousTrack,
  currentTrackAtom,
  $mediaStore,
  setPlaying,
  toggleShuffle,
  toggleRepeat,
  shuffleAtom,
  repeatModeAtom,
} from '@/stores/mediaStore';

interface MiniMediaPlayerControlsProps {
  mediaElementRef: React.RefObject<HTMLMediaElement>; // Changed to HTMLMediaElement
}

const formatTime = (time: number): string => {
  if (isNaN(time) || time === Infinity) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const MiniMediaPlayerControls: React.FC<MiniMediaPlayerControlsProps> = ({
  mediaElementRef,
}) => {
  const theme = useTheme();
  const { isFetchingMedia } = useStore($mediaStore); // Corrected: use isFetchingMedia
  const isPlaying = useStore(isPlayingAtom);
  const trackProgress = useStore(progressAtom);
  const duration = useStore(durationAtom);
  const currentTrack = useStore(currentTrackAtom);
  const shuffle = useStore(shuffleAtom);
  const repeatMode = useStore(repeatModeAtom);

  const handlePlayPause = () => {
    // This will now call setPlaying in mediaStore, which directly interacts with the mediaElement
    setPlaying(!isPlaying);
  };

  const handleNext = () => {
    nextTrack();
  };

  const handlePrevious = () => {
    previousTrack();
  };

  const handleTimeChange = (event: Event, newValue: number | number[]) => {
    const newTime = typeof newValue === 'number' ? newValue : 0;
    if (mediaElementRef?.current) {
      mediaElementRef.current.currentTime = newTime;
      setTrackProgress(newTime);
    }
  };

  const handleTimeChangeCommitted = useCallback(
    (_event: Event | SyntheticEvent, newValue: number | number[]) => {
      const newTime = typeof newValue === 'number' ? newValue : 0;
      if (mediaElementRef?.current) {
        mediaElementRef.current.currentTime = newTime;
        setTrackProgress(newTime);
      }
    },
    [mediaElementRef, setTrackProgress],
  );

  const isPlayerDisabled = !currentTrack || isFetchingMedia; // Corrected: use isFetchingMedia

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flexGrow: 1,
        width: '100%',
        color: theme.palette.text.primary,
        px: 1, // Add some horizontal padding for a compact look
      }}
    >
      {/* Control buttons row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
        <IconButton
          size="small"
          sx={{ color: 'inherit' }}
          onClick={toggleShuffle}
          disabled={isPlayerDisabled}
        >
          <Shuffle fontSize="small" color={shuffle ? 'primary' : 'inherit'} />
        </IconButton>
        <IconButton
          size="small"
          sx={{ color: 'inherit' }}
          onClick={handlePrevious}
          disabled={isPlayerDisabled}
        >
          <SkipPrevious fontSize="small" />
        </IconButton>
        <IconButton
          size="medium" // Adjusted size for play/pause button
          onClick={handlePlayPause}
          disabled={isPlayerDisabled}
          sx={{
            color: theme.palette.text.primary,
            bgcolor: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            },
            borderRadius: '50%',
            width: 32, // Smaller width
            height: 32, // Smaller height
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isFetchingMedia ? ( // Corrected: use isFetchingMedia
            <CircularProgress size={18} color="inherit" /> // Smaller progress spinner
          ) : isPlaying ? (
            <Pause fontSize="small" /> // Smaller icon
          ) : (
            <PlayArrow fontSize="small" /> // Smaller icon
          )}
        </IconButton>
        <IconButton
          size="small"
          sx={{ color: 'inherit' }}
          onClick={handleNext}
          disabled={isPlayerDisabled}
        >
          <SkipNext fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          sx={{ color: 'inherit' }}
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
      </Box>

      {/* Progress bar row */}
      <Box
        sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <Typography variant="caption" color="text.secondary">
          {formatTime(trackProgress)}
        </Typography>
        <Slider
          size="small"
          value={trackProgress ?? 0}
          onChange={handleTimeChange}
          onChangeCommitted={handleTimeChangeCommitted}
          min={0}
          max={duration ?? 0}
          aria-label="Track progress"
          sx={{
            color: theme.palette.primary.main,
            height: 4,
            width: '100%',
            '& .MuiSlider-thumb': {
              width: 8, // Smaller thumb
              height: 8,
            },
          }}
          disabled={isPlayerDisabled}
        />
        <Typography variant="caption" color="text.secondary">
          {formatTime(duration)}
        </Typography>
      </Box>
    </Box>
  );
};

export default MiniMediaPlayerControls;
