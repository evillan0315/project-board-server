import React, { useState, useEffect, useCallback, SyntheticEvent } from 'react';
import { Box, IconButton, Slider, Typography, useTheme } from '@mui/material';
import { VolumeUp, VolumeOff, VolumeDown } from '@mui/icons-material';
import { useStore } from '@nanostores/react';
import {
  volumeAtom,
  setVolume,
  $mediaStore, // Import the global media store
} from '@/stores/mediaStore';

const MediaPlayerVolumeControl: React.FC = () => {
  const theme = useTheme();

  // State from global media store
  const globalVolume = useStore(volumeAtom); // 0-100 percentage
  const { mediaElement } = useStore($mediaStore); // Access mediaElement from global store

  // Local state for mute status and to remember volume before muting
  const [isMutedLocally, setIsMutedLocally] = useState(false);
  const [lastVolumeBeforeMute, setLastVolumeBeforeMute] = useState(70); // Default to 70% volume, matches initial volumeAtom
  const [showVolumeSlider, setShowVolumeSlider] = useState(false); // State to toggle slider visibility

  // Sync local mute state with media element on mount or when mediaElement changes
  useEffect(() => {
    if (mediaElement) {
      setIsMutedLocally(mediaElement.muted);
      // Initialize lastVolumeBeforeMute if mediaElement has a non-zero volume and it wasn't already muted
      if (!mediaElement.muted && mediaElement.volume > 0) {
        setLastVolumeBeforeMute(Math.round(mediaElement.volume * 100));
      } else if (mediaElement.muted) {
        setLastVolumeBeforeMute(globalVolume > 0 ? globalVolume : 70);
      }
    }
  }, [mediaElement, globalVolume]);

  // Effect to apply local mute state to the actual media element
  useEffect(() => {
    if (mediaElement) {
      mediaElement.muted = isMutedLocally;
    }
  }, [isMutedLocally, mediaElement]);

  const handleVolumeChange = useCallback((_event: Event, newValue: number | number[]) => {
    const newVolume = typeof newValue === 'number' ? newValue : 0;
    setVolume(newVolume); // Updates global store's volumeAtom and mediaElement.volume

    if (newVolume > 0 && isMutedLocally) {
      setIsMutedLocally(false); // If volume is increased from 0, implicitly unmute
    }
    if (newVolume > 0) {
      setLastVolumeBeforeMute(newVolume); // Keep track of the last non-zero volume
    }
  }, [isMutedLocally, setVolume]);

  const toggleMute = useCallback(() => {
    if (!mediaElement) return;

    if (isMutedLocally) {
      // If currently muted, unmute and restore last known volume
      setVolume(lastVolumeBeforeMute); // This will update volumeAtom and mediaElement.volume
      setIsMutedLocally(false); // Mark as unmuted locally
    } else {
      // If currently unmuted, save current volume and mute
      if (globalVolume > 0) {
        setLastVolumeBeforeMute(globalVolume); // Save current non-zero volume from store
      }
      setVolume(0); // Mute via store (sets volumeAtom to 0, updates mediaElement.volume)
      setIsMutedLocally(true); // Mark as muted locally
    }
  }, [isMutedLocally, mediaElement, lastVolumeBeforeMute, globalVolume, setVolume]);

  const toggleVolumeSliderVisibility = useCallback(() => {
    setShowVolumeSlider((prev) => !prev);
  }, []);

  const getVolumeIcon = () => {
    if (isMutedLocally || globalVolume === 0) {
      return <VolumeOff />;
    } else if (globalVolume < 50) {
      return <VolumeDown />;
    } else {
      return <VolumeUp />;
    }
  };

  const verticalSliderContainerSx = {
    position: 'absolute',
    bottom: '36px', // Position above the volume icon
    left: '50%',
    transform: 'translateX(-50%)',
    display: showVolumeSlider ? 'flex' : 'none',
    flexDirection: 'column',
    alignItems: 'center',
    bgcolor: theme.palette.background.default,
    p: 1,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[3],
    zIndex: theme.zIndex.tooltip,
    gap: 1,
    height: '120px',
  };

  const volumeSliderSx = {
    color: theme.palette.primary.main,
    '& .MuiSlider-track': {
      width: '3px',
    },
    '& .MuiSlider-rail': {
      width: '3px',
    },
    '& .MuiSlider-thumb': {
      width: '10px',
      height: '10px',
      transition: '0.2s',
      '&:hover, &.Mui-focusVisible': {
        boxShadow: `0px 0px 0px 8px ${theme.palette.action.hover}`,
      },
      '&.Mui-active': {
        width: '12px',
        height: '12px',
      },
    },
  };

  return (
    <Box
      className='flex items-center justify-end relative gap-1 flex-grow'
    >
      {/* Volume Controls (icon + vertical slider) */}
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <IconButton
          size="medium"
          sx={{ color: theme.palette.text.primary }}
          onClick={toggleVolumeSliderVisibility}
          onDoubleClick={toggleMute}
        >
          {getVolumeIcon()}
        </IconButton>

        {/* Vertical Volume Slider (conditionally rendered and absolutely positioned) */}
        <Box sx={verticalSliderContainerSx}>
          <Slider
            size="small"
            value={globalVolume ?? 0}
            onChange={handleVolumeChange}
            min={0}
            max={100}
            orientation="vertical"
            aria-label="Volume"
            sx={volumeSliderSx}
            style={{ height: '100px' }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default MediaPlayerVolumeControl;
