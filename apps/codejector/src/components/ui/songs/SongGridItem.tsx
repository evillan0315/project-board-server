import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  CardMedia,
  Grid,
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

interface SongGridItemProps {
  song: MediaFileResponseDto;
  onPlay: (song: MediaFileResponseDto) => void;
  onFavorite: (songId: string) => void;
  onAction: (action: string, song: MediaFileResponseDto) => void;
}

export const SongGridItem: React.FC<SongGridItemProps> = ({
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
    <Grid container xs={12} sm={6} md={4} lg={3}>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardActionArea onClick={() => onPlay(song)} sx={{ flexGrow: 1 }}>
          <CardMedia
            component="img"
            height="200"
            image={
              (song.metadata && song.metadata[0]?.data.thumbnail) ||
              '/placeholder-album.jpg'
            }
            alt={song.song?.title}
            sx={{ objectFit: 'cover' }}
          />
          <CardContent>
            <Typography gutterBottom variant="h6" noWrap>
              {song.song?.title}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              noWrap
            ></Typography>
            <Typography variant="body2" color="text.secondary"></Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary"></Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDuration(song.song?.duration || 0)}
              </Typography>
            </Box>
          </CardContent>
        </CardActionArea>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
          <IconButton
            onClick={() => onFavorite(song.id)}
            color={true ? 'error' : 'default'}
          ></IconButton>
          <IconButton onClick={handleMenuOpen}>
            <MoreVert />
          </IconButton>
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
    </Grid>
  );
};
