import React, { useState } from 'react';
import {
  Box,
  Card,
  CardActionArea,
  CardMedia,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import { MediaFileResponseDto } from '@/types/refactored/media';

// Types
interface MenuItemType {
  label: string;
  value: string;
  icon: React.ReactElement;
  divider?: boolean;
}

interface SongThumbItemProps {
  song: MediaFileResponseDto;
  onPlay: (song: MediaFileResponseDto) => void;
  onFavorite: (songId: string) => void;
  onAction: (action: string, song: MediaFileResponseDto) => void;
}

export const SongThumbItem: React.FC<SongThumbItemProps> = ({
  song,
  onPlay,
  onFavorite,
  onAction,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const menuItems: MenuItemType[] = [
    { label: 'Edit', value: 'edit', icon: <></> },
    { label: 'Delete', value: 'delete', icon: <></>, divider: true },
    { label: 'Download Metadata', value: 'download', icon: <></> },
    { label: 'Update Metadata', value: 'update', icon: <></> },
  ];

  return (
    <Box sx={{ width: 160 }}>
      <Card>
        <CardActionArea onClick={() => onPlay(song)}>
          <CardMedia
            component="img"
            height="160"
            image={
              (song.metadata && song.metadata[0]?.data.thumbnail) ||
              '/placeholder-album.jpg'
            }
            alt={song.song?.title}
            sx={{ objectFit: 'cover' }}
          />
        </CardActionArea>
        <Box sx={{ p: 1 }}>
          <Typography variant="subtitle2" noWrap title={song.song?.title}>
            {song.song?.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            noWrap
          ></Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 0.5,
            }}
          >
            <IconButton
              size="small"
              onClick={() => onFavorite(song.id)}
              color={true ? 'error' : 'default'}
            ></IconButton>
            <Typography variant="caption" color="text.secondary">
              {formatDuration(song.song?.duration || 0)}
            </Typography>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
      >
        {menuItems.map((item, index) => (
          <Box key={item.value}>
            <MenuItem onClick={() => onAction(item.value, song)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
            {item.divider && <Divider />}
          </Box>
        ))}
      </Menu>
    </Box>
  );
};
