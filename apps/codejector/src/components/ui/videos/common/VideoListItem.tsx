import React from 'react';
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Rating,
} from '@mui/material';
import {
  PlayArrow,
  Favorite,
  FavoriteBorder,
  MoreVert,
} from '@mui/icons-material';
import { MediaFileResponseDto } from '@/types/refactored/media';

interface VideoListItemProps {
  video: MediaFileResponseDto;
  hoveredVideo: string | null;
  onPlay: (video: MediaFileResponseDto) => void; // Updated prop type
  onFavorite: (videoId: string) => void;
  handleMenuOpen: (
    event: React.MouseEvent<HTMLElement>,
    video: MediaFileResponseDto,
  ) => void;
  handleVideoHover: (videoId: string | null) => void;
  formatDuration: (minutes: number) => string;
}

const VideoListItem: React.FC<VideoListItemProps> = ({
  video,
  hoveredVideo,
  onPlay,
  onFavorite,
  handleMenuOpen,
  handleVideoHover,
  formatDuration,
}) => (
    <Card
      key={video.id}
      sx={{
        mb: 1,
        bgcolor:
          hoveredVideo === video.id ? 'action.hover' : 'background.paper',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={() => handleVideoHover(video.id)}
      onMouseLeave={() => handleVideoHover(null)}
    >
      <Box sx={{ display: 'flex' }}>
        <CardMedia
          component="img"
          sx={{ width: 160, height: 90, objectFit: 'cover' }}
          image={video.url || ''}
          alt={video.video?.title}
        />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            minWidth: 0,
          }}
        >
          <CardContent sx={{ flexGrow: 1, py: 1 }}>
            <Typography variant="h6" noWrap>
              {video.video?.title}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 0.5,
                mb: 0.5,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {video.video?.year}
              </Typography>
              <span>•</span>
              <Typography variant="body2" color="text.secondary">
                {formatDuration(video.video?.duration || 0)}
              </Typography>
              <span>•</span>
              <Rating
                size="small"
                value={(video.video?.rating || 0) / 2}
                precision={0.5}
                readOnly
              />
            </Box>
            <Typography variant="body2" color="text.secondary" noWrap>
              {video.video?.description}
            </Typography>
          </CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
            <IconButton
              onClick={() => onFavorite(video.id)}
              color={video.video?.rating ? 'error' : 'default'}
              size="small"
            >
              {video.video?.rating ? <Favorite /> : <FavoriteBorder />}
            </IconButton>
            <IconButton onClick={() => onPlay(video)} size="small"> {/* Call the updated onPlay prop */}
              <PlayArrow />
            </IconButton>
            <IconButton onClick={(e) => handleMenuOpen(e, video)} size="small">
              <MoreVert />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Card>
  );

export default VideoListItem;
