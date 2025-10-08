import React from 'react';
import { Box, IconButton, Typography, useTheme, SxProps } from '@mui/material';
import { FavoriteBorder, Album, Movie } from '@mui/icons-material';
import { useStore } from '@nanostores/react';
import {
  currentTrackAtom,
  $mediaStore,
} from '@/stores/mediaStore';
import { FileType } from '@/types/refactored/media';

// Define styles outside the component for memoization and clean JSX
const trackInfoWrapperStyles: SxProps = {
  display: 'flex',
  alignItems: 'center',
  minWidth: 0,
  width: '30%',
  overflow: 'hidden',
  flexShrink: 0,
};

const titleAndArtistColumnStyles: SxProps = {
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  minWidth: 0,
  mr: 1,
};

const MediaPlayerTrackInfo: React.FC = () => {
  const theme = useTheme();
  const currentTrack = useStore(currentTrackAtom);

  const titleText = currentTrack?.song?.title || currentTrack?.video?.title || 'Unknown Title';
  const artistText = currentTrack?.metadata?.[0]?.tags?.join(', ') || 'Unknown Artist';

  return (
    <Box sx={trackInfoWrapperStyles}>
      {currentTrack?.fileType === FileType.VIDEO ? (
        <Movie sx={{ fontSize: 30, mr: 1, color: theme.palette.text.secondary }} />
      ) : (
        <Album sx={{ fontSize: 30, mr: 1, color: theme.palette.text.secondary }} />
      )}
      <Box sx={titleAndArtistColumnStyles}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          noWrap
        >
          {titleText}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          noWrap
        >
          {artistText}
        </Typography>
      </Box>
      <IconButton
        size="small"
        sx={{ ml: 0, color: theme.palette.text.secondary, flexShrink: 0 }}
        disabled
      >
        <FavoriteBorder fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default MediaPlayerTrackInfo;
