import React, { useEffect, useState, useCallback, SyntheticEvent } from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  Typography,
  Slider,
  IconButton,
  useTheme,
  CircularProgress,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import RepeatIcon from '@mui/icons-material/Repeat';
import RepeatOneIcon from '@mui/icons-material/RepeatOne';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AlbumIcon from '@mui/icons-material/Album';
import MovieIcon from '@mui/icons-material/Movie'; // Import MovieIcon for video

import {
  $spotifyStore,
  togglePlayPause,
  setTrackProgress, // Changed from setPlaybackProgress
  setVolume,
  toggleShuffle,
  toggleRepeat,
  nextTrack,
  previousTrack,
  setLoading,
  setError,
  volumeAtom,
  shuffleAtom,
  repeatModeAtom,
  currentTrackAtom,
  isPlayingAtom,
  progressAtom,
  durationAtom,
  isVideoModalOpenAtom,
  setIsVideoModalOpen,
  bufferedAtom, // New: Import bufferedAtom
} from '@/stores/spotifyStore';
import { FileType } from '@/types'; // New: Import BufferedRange

interface SpotifyPlayerBarProps {
  mediaRef: React.RefObject<HTMLMediaElement | null>; // Now receives the active media element ref, allowing null
  playerBarRef: React.RefObject<HTMLDivElement | null>; // To measure its height, allowing null
}

const SpotifyPlayerBar: React.FC<SpotifyPlayerBarProps> = ({
  mediaRef,
  playerBarRef,
}) => {
  const theme = useTheme();
  const { loading, error } = useStore($spotifyStore);
  const currentTrack = useStore(currentTrackAtom);
  const isPlaying = useStore(isPlayingAtom);
  const progress = useStore(progressAtom);
  const duration = useStore(durationAtom); // New: Get duration from atom
  const volume = useStore(volumeAtom);
  const shuffle = useStore(shuffleAtom);
  const repeatMode = useStore(repeatModeAtom);
  const isVideoModalOpen = useStore(isVideoModalOpenAtom);
  const buffered = useStore(bufferedAtom); // New: Get buffered ranges

  const [internalProgress, setInternalProgress] = useState(0);
  const [internalVolume, setInternalVolume] = useState(volume);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

  // Sync volume from store to internal state (for display)
  useEffect(() => {
    setInternalVolume(volume);
    if (mediaRef.current) {
      setIsMuted(mediaRef.current.muted || mediaRef.current.volume === 0);
    }
  }, [volume, mediaRef.current]);

  // Sync progress from store to internal state (for display)
  useEffect(() => {
    // Only update internal progress if not actively seeking
    if (!isSeeking) {
      setInternalProgress(progress);
    }
  }, [progress, isSeeking]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handlePlayPause = useCallback(() => {
    setLoading(true);
    if (!currentTrack?.mediaSrc) {
      setError('No track selected to play.');
      return;
    }

    // If it's a video and the video modal is not open, open it
    if (currentTrack.fileType === FileType.VIDEO && !isVideoModalOpen) {
      setIsVideoModalOpen(true);
      setLoading(false);
    }

    togglePlayPause(); // This is a nanostore action, stable.
  }, [currentTrack, isVideoModalOpen, setIsVideoModalOpen, setError]); // Removed togglePlayPause from dependencies as it's a stable nanostore action

  const handleVolumeSliderChange = useCallback(
    (_event: Event, newValue: number | number[]) => {
      const newVol = newValue as number;
      const media = mediaRef.current;
      if (media) {
        media.volume = newVol / 100;
        if (newVol > 0 && media.muted) {
          media.muted = false;
        }
        if (newVol === 0 && !media.muted) {
          media.muted = true;
        }
      }
      setInternalVolume(newVol);
    },
    [mediaRef],
  );

  const handleVolumeSliderChangeCommitted = useCallback(
    (_event: Event | SyntheticEvent, newValue: number | number[]) => {
      setVolume(newValue as number);
    },
    [],
  );

  const handleToggleMute = useCallback(() => {
    const media = mediaRef.current;
    if (media) {
      media.muted = !media.muted;
      setIsMuted(media.muted);
      if (!media.muted && media.volume === 0) {
        // If unmuting from 0 volume, set a default volume
        media.volume = 0.5;
        setVolume(50);
      } else {
        setVolume(Math.round(media.volume * 100));
      }
    }
  }, [mediaRef, setVolume]);

  const handleProgressSliderChange = useCallback(
    (_event: Event, newValue: number | number[]) => {
      setIsSeeking(true);
      setInternalProgress(newValue as number);
    },
    [],
  );

  const handleProgressSliderChangeCommitted = useCallback(
    (_event: Event | SyntheticEvent, newValue: number | number[]) => {
      const media = mediaRef.current;
      if (media && currentTrack) {
        media.currentTime = newValue as number;
        setTrackProgress(newValue as number);
      }
      setIsSeeking(false);
    },
    [currentTrack, mediaRef],
  );

  return (
    <Box
      ref={playerBarRef} // Attach ref to measure height
      sx={{
        gridArea: 'player',
        bgcolor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        color: theme.palette.text.primary,
        flexShrink: 0,
        zIndex: 11, // Ensure player bar is above video overlay
      }}
    >
      {error && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 80,
            left: 0,
            width: '100%',
            zIndex: 1,
            p: 1,
          }}
        >
          <Typography
            color="error"
            variant="caption"
            sx={{
              bgcolor: theme.palette.error.main + 'E0',
              p: 0.5,
              borderRadius: 1,
            }}
          >
            {error}
          </Typography>
        </Box>
      )}
      {/* Left section: Current Song Info */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '30%',
          minWidth: '180px',
        }}
      >
        {currentTrack?.coverArt ? (
          <img
            src={currentTrack.coverArt}
            alt={currentTrack.album}
            style={{
              width: 40,
              height: 40,
              marginRight: theme.spacing(1),
              borderRadius: 4,
              objectFit: 'cover',
            }}
          />
        ) : currentTrack?.fileType === FileType.VIDEO ? (
          <MovieIcon
            sx={{ fontSize: 40, mr: 1, color: theme.palette.text.secondary }}
          />
        ) : (
          <AlbumIcon
            sx={{ fontSize: 40, mr: 1, color: theme.palette.text.secondary }}
          />
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {currentTrack?.title || 'No track playing'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {currentTrack?.artist || 'Artist Name'}
          </Typography>
        </Box>
        <IconButton
          size="small"
          sx={{ ml: 2, color: theme.palette.text.secondary }}
          disabled={!currentTrack}
        >
          <FavoriteBorderIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Middle section: Playback Controls and Progress */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flexGrow: 1,
          maxWidth: '600px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <IconButton
            size="small"
            sx={{ color: theme.palette.text.primary }}
            onClick={toggleShuffle}
          >
            <ShuffleIcon
              fontSize="small"
              color={shuffle ? 'primary' : 'inherit'}
            />
          </IconButton>
          <IconButton
            size="small"
            sx={{ color: theme.palette.text.primary }}
            onClick={previousTrack}
            disabled={!currentTrack}
          >
            <SkipPreviousIcon />
          </IconButton>
          <IconButton
            size="large"
            onClick={handlePlayPause}
            disabled={!currentTrack || loading}
            sx={{
              color: theme.palette.text.primary,
              bgcolor: theme.palette.primary.main,
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              },
              borderRadius: '50%',
              width: 48,
              height: 48,
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : isPlaying ? (
              <PauseIcon fontSize="large" />
            ) : (
              <PlayArrowIcon fontSize="large" />
            )}
          </IconButton>
          <IconButton
            size="small"
            sx={{ color: theme.palette.text.primary }}
            onClick={nextTrack}
            disabled={!currentTrack}
          >
            <SkipNextIcon />
          </IconButton>
          <IconButton
            size="small"
            sx={{ color: theme.palette.text.primary }}
            onClick={toggleRepeat}
          >
            {repeatMode === 'track' ? (
              <RepeatOneIcon fontSize="small" color="primary" />
            ) : (
              <RepeatIcon
                fontSize="small"
                color={repeatMode === 'context' ? 'primary' : 'inherit'}
              />
            )}
          </IconButton>
        </Box>
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {formatTime(internalProgress)}
          </Typography>

          <Box sx={{ flexGrow: 1, position: 'relative', height: 4 }}>
            {' '}
            {/* Wrapper for Slider and buffer */}
            {/* Buffer Visual */}
            {currentTrack && duration > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  height: '100%',
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: theme.palette.action.disabledBackground, // Rail background
                }}
              >
                {buffered.map((range, index) => {
                  const rangeStartPercent = (range.start / duration) * 100;
                  const rangeWidthPercent =
                    ((range.end - range.start) / duration) * 100;
                  return (
                    <Box
                      key={index}
                      sx={{
                        position: 'absolute',
                        left: `${rangeStartPercent}%`,
                        width: `${rangeWidthPercent}%`,
                        height: '100%',
                        bgcolor: theme.palette.text.secondary + '40', // Semi-transparent color for buffer
                        borderRadius: 2,
                      }}
                    />
                  );
                })}
              </Box>
            )}
            <Slider
              size="small"
              value={internalProgress ?? 0}
              onChange={handleProgressSliderChange}
              onChangeCommitted={handleProgressSliderChangeCommitted}
              min={0}
              max={duration ?? 0}
              aria-label="Track progress"
              sx={{
                position: 'relative', // To ensure zIndex works
                zIndex: 1, // Slider on top of buffer visual
                color: theme.palette.primary.main,
                height: 4,
                width: '100%', // Take full width of parent Box
                padding: '0 !important', // Remove default padding to align perfectly
                '& .MuiSlider-thumb': {
                  width: 12,
                  height: 12,
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: `0px 0px 0px 8px ${theme.palette.primary.main}40`,
                  },
                },
                '& .MuiSlider-rail': {
                  opacity: 0, // Hide default rail as we have a custom buffer background
                },
                '& .MuiSlider-track': {
                  border: 'none',
                },
              }}
              disabled={!currentTrack}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {formatTime(duration || 0)}
          </Typography>
        </Box>
      </Box>

      {/* Right section: Volume and other controls */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '30%',
          justifyContent: 'flex-end',
          minWidth: '180px',
        }}
      >
        <IconButton
          size="small"
          sx={{ color: theme.palette.text.primary }}
          onClick={handleToggleMute}
        >
          {isMuted || internalVolume === 0 ? (
            <VolumeOffIcon />
          ) : (
            <VolumeUpIcon />
          )}
        </IconButton>
        <Slider
          size="small"
          value={internalVolume ?? 0}
          onChange={handleVolumeSliderChange}
          onChangeCommitted={handleVolumeSliderChangeCommitted}
          min={0}
          max={100}
          aria-label="Volume"
          sx={{
            width: 100,
            color: theme.palette.primary.main,
            height: 4,
            ml: 1,
            '& .MuiSlider-thumb': {
              width: 12,
              height: 12,
            },
          }}
        />
        <IconButton
          size="small"
          sx={{ ml: 2, color: theme.palette.text.primary }}
          disabled
        >
          {/* <FullscreenIcon /> */}
        </IconButton>
      </Box>
    </Box>
  );
};

export default SpotifyPlayerBar;
