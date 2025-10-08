import React from 'react';
import {
  Box,
  Card,
  CardActionArea,
  CardMedia,
  Typography,
  IconButton,
  Grow,
  Rating,
} from '@mui/material';
import { Favorite, FavoriteBorder, MoreVert } from '@mui/icons-material';
import { MediaFileResponseDto } from '@/types/refactored/media';

interface VideoThumbItemProps {
  video: MediaFileResponseDto;
  hoveredVideo: string | null;
  openDetailDialog: (video: MediaFileResponseDto) => void;
  onFavorite: (videoId: string) => void;
  handleMenuOpen: (
    event: React.MouseEvent<HTMLElement>,
    video: MediaFileResponseDto,
  ) => void;
  handleVideoHover: (videoId: string | null) => void;
  formatDuration: (minutes: number) => string;
}

const VideoThumbItem: React.FC<VideoThumbItemProps> = ({
  video,
  hoveredVideo,
  openDetailDialog,
  onFavorite,
  handleMenuOpen,
  handleVideoHover,
  formatDuration,
}) => (
    <Box
      key={video.id}
      sx={{
        width: 240,
        transition: 'transform 0.3s',
        transform: hoveredVideo === video.id ? 'scale(1.05)' : 'scale(1)',
        zIndex: hoveredVideo === video.id ? 1 : 0,
      }}
      onMouseEnter={() => handleVideoHover(video.id)}
      onMouseLeave={() => handleVideoHover(null)}
    >
      <Card sx={{ position: 'relative' }}>
        <CardActionArea onClick={() => openDetailDialog(video)}>
          <CardMedia
            component="img"
            height="320"
            image={video.url || ''}
            alt={video.video?.title}
            sx={{ objectFit: 'cover' }}
          />
          <Grow in={hoveredVideo === video.id} timeout={300}>
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                p: 1.5,
                color: 'white',
              }}
            >
              <Typography variant="h6" noWrap>
                {video.video?.title}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 0.5,
                }}
              >
                <Typography variant="body2">{video.video?.year}</Typography>
                <span>•</span>
                <Typography variant="body2">
                  {formatDuration(video.video?.duration || 0)}
                </Typography>
              </Box>
              <Rating
                value={(video.video?.rating || 0) / 2}
                precision={0.5}
                size="small"
                readOnly
              />
            </Box>
          </Grow>
        </CardActionArea>
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            gap: 0.5,
          }}
        >
          <IconButton
            onClick={() => onFavorite(video.id)}
            color={video.video?.rating ? 'error' : 'default'}
            size="small"
            sx={{
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'background.paper' },
            }}
          >
            {video.video?.rating ? <Favorite /> : <FavoriteBorder />}
          </IconButton>
          <IconButton
            onClick={(e) => handleMenuOpen(e, video)}
            size="small"
            sx={{
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'background.paper' },
            }}
          >
            <MoreVert />
          </IconButton>
        </Box>
      </Card>
    </Box>
  );

export default VideoThumbItem;
