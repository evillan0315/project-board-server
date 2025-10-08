import React from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  CardMedia,
  IconButton,
  Typography,
  Rating,
  Chip,
  Fab,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  PlayArrow,
  Favorite,
  FavoriteBorder,
  Close,
} from '@mui/icons-material';
import { MediaFileResponseDto } from '@/types/refactored/media';

interface VideoDetailDialogProps {
  open: boolean;
  onClose: () => void;
  selectedVideo: MediaFileResponseDto | null;
  onPlay: (video: MediaFileResponseDto) => void; // Updated prop type
  onFavorite: (videoId: string) => void;
  formatDuration: (minutes: number) => string;
}

const VideoDetailDialog: React.FC<VideoDetailDialogProps> = ({
  open,
  onClose,
  selectedVideo,
  onPlay,
  onFavorite,
  formatDuration,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogContent sx={{ p: 0, position: 'relative' }}>
        {selectedVideo && (
          <>
            <CardMedia
              component="img"
              image={selectedVideo.url || ''}
              alt={selectedVideo.video?.title}
              sx={{ width: '100%', height: { xs: 200, sm: 400 } }}
            />
            <IconButton
              onClick={onClose}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
              }}
            >
              <Close />
            </IconButton>
            <Box sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom>
                {selectedVideo.video?.title}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                <Typography variant="body1">
                  {selectedVideo.video?.year}
                </Typography>
                <Typography variant="body1">
                  {formatDuration(selectedVideo.video?.duration || 0)}
                </Typography>
                <Rating
                  value={(selectedVideo.video?.rating || 0) / 2}
                  precision={0.5}
                  readOnly
                />
              </Box>
              <Typography variant="body1" paragraph>
                {selectedVideo.video?.description}
              </Typography>
              {selectedVideo.video?.director && (
                <Typography variant="body2" gutterBottom>
                  <strong>Director:</strong> {selectedVideo.video?.director}
                </Typography>
              )}
              {selectedVideo.video?.cast && (
                <Typography variant="body2" gutterBottom>
                  <strong>Cast:</strong> {selectedVideo.video?.cast.join(', ')}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                {selectedVideo.video?.cast?.map((genre) => (
                  <Chip key={genre} label={genre} variant="outlined" />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Fab
                  variant="extended"
                  color="primary"
                  onClick={() => onPlay(selectedVideo)} // Call the updated onPlay prop
                  sx={{ minWidth: 120 }}
                >
                  <PlayArrow sx={{ mr: 1 }} />
                  Play
                </Fab>
                <IconButton
                  onClick={() => onFavorite(selectedVideo.id)}
                  color={selectedVideo.video?.rating ? 'error' : 'default'}
                  size="large"
                >
                  {selectedVideo.video?.rating ? (
                    <Favorite />
                  ) : (
                    <FavoriteBorder />
                  )}
                </IconButton>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VideoDetailDialog;
