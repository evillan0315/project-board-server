import React from 'react';
import {
  Grid,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Rating,
  IconButton,
  Slide,
  Fab,
} from '@mui/material';
import {
  PlayArrow,
  Favorite,
  FavoriteBorder,
  MoreVert,
} from '@mui/icons-material';
import { MediaFileResponseDto } from '@/types/refactored/media';

interface VideoGridItemProps {
  video: MediaFileResponseDto;
  hoveredVideo: string | null;
  openDetailDialog: (video: MediaFileResponseDto) => void;
  onPlay: (video: MediaFileResponseDto) => void; // Updated prop type
  onFavorite: (videoId: string) => void;
  handleMenuOpen: (
    event: React.MouseEvent<HTMLElement>,
    video: MediaFileResponseDto,
  ) => void;
  handleVideoHover: (videoId: string | null) => void;
  formatDuration: (minutes: number) => string;
}

const VideoGridItem: React.FC<VideoGridItemProps> = ({
  video,
  hoveredVideo,
  openDetailDialog,
  onPlay,
  onFavorite,
  handleMenuOpen,
  handleVideoHover,
  formatDuration,
}) => (
    <Grid item xs={12} sm={6} md={4} lg={3} key={video.id}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s, box-shadow 0.3s',
          transform: hoveredVideo === video.id ? 'scale(1.05)' : 'scale(1)',
          zIndex: hoveredVideo === video.id ? 1 : 0,
          boxShadow: hoveredVideo === video.id ? 6 : 1,
        }}
        onMouseEnter={() => handleVideoHover(video.id)}
        onMouseLeave={() => handleVideoHover(null)}
      >
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height="200"
            image={video.url || ''}
            alt={video.video?.title}
            sx={{ objectFit: 'cover' }}
            onClick={() => openDetailDialog(video)}
          />
          <Slide direction="up" in={hoveredVideo === video.id} timeout={300}>
            <Fab
              color="primary"
              aria-label="play"
              size="small"
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onPlay(video); // Call the updated onPlay prop
              }}
            >
              <PlayArrow />
            </Fab>
          </Slide>
        </Box>
        <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
          <Typography gutterBottom variant="h6" noWrap>
            {video.video?.title}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 0.5,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {video.video?.year}
            </Typography>
            {/*<Chip label={formatDuration(video.video?.duration || 0)} size="small" />*/}
          </Box>
          <Rating
            value={(video.video?.rating || 0) / 2}
            precision={0.5}
            size="small"
            readOnly
          />
        </CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
          <IconButton
            onClick={() => onFavorite(video.id)}
            color={video.video?.rating ? 'error' : 'default'}
            size="small"
          >
            {video.video?.rating ? <Favorite /> : <FavoriteBorder />}
          </IconButton>
          <IconButton onClick={(e) => handleMenuOpen(e, video)} size="small">
            <MoreVert />
          </IconButton>
        </Box>
      </Card>
    </Grid>
  );

export default VideoGridItem;
