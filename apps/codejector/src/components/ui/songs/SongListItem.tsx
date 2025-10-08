import React, { useState } from 'react';
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CardMedia,
  Typography,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import { PlayArrow, MoreVert } from '@mui/icons-material';
import { MediaFileResponseDto } from '@/types/refactored/media';

// Types
interface MenuItemType {
  label: string;
  value: string;
  icon: React.ReactElement;
  divider?: boolean;
}

interface SongListItemProps {
  song: MediaFileResponseDto;
  onPlay: (song: MediaFileResponseDto) => void; // onPlay now directly triggers playback
  onFavorite: (songId: string) => void;
  onAction: (action: string, song: MediaFileResponseDto) => void;
}

export const SongListItem: React.FC<SongListItemProps> = ({
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
    <List sx={{ bgcolor: 'background.paper' }}>
      <ListItem
        key={song.id}
        secondaryAction={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={() => onFavorite(song.id)}
              color={true ? 'error' : 'default'}
            ></IconButton>
            <IconButton onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          </Box>
        }
        disablePadding
      >
        <ListItemButton onClick={() => onPlay(song)} sx={{ py: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <PlayArrow />
          </ListItemIcon>

          {song.metadata && song.metadata[0]?.data.thumbnail && (
            <CardMedia
              component="img"
              sx={{ width: 60, height: 60, borderRadius: 1, mr: 2 }}
              image={song.metadata[0]?.data.thumbnail}
              alt={song.song?.title}
            />
          )}
          <ListItemText primary={song.song?.title} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', gap: 0.5 }}></Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ minWidth: 50, textAlign: 'right' }}
            >
              {formatDuration(song.song?.duration || 0)}
            </Typography>
          </Box>
        </ListItemButton>
      </ListItem>

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
    </List>
  );
};
