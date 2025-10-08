import React from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
  Divider,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import AddBoxIcon from '@mui/icons-material/AddBox';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import SettingsIcon from '@mui/icons-material/Settings'; // New: Import SettingsIcon
import { useStore } from '@nanostores/react';
import { $spotifyStore } from '@/stores/spotifyStore';

interface SpotifySidebarProps {
  currentView: 'home' | 'search' | 'library' | 'settings';
  onSelectView: (view: 'home' | 'search' | 'library' | 'settings') => void;
}
const SpotifySidebar: React.FC<SpotifySidebarProps> = ({
  currentView,
  onSelectView,
}) => {
  const theme = useTheme();
  const store = useStore($spotifyStore);
  const playlists = store?.playlists ?? [];
  const primaryNavItems = [
    { text: 'Home', icon: HomeIcon, view: 'home' as const },
    { text: 'Search', icon: SearchIcon, view: 'search' as const },
    { text: 'Your Library', icon: LibraryMusicIcon, view: 'library' as const },
    { text: 'Settings', icon: SettingsIcon, view: 'settings' as const }, // New: Added Settings item
  ];

  const secondaryNavItems = [
    { text: 'Create Playlist', icon: AddBoxIcon },
    { text: 'Liked Songs', icon: FavoriteIcon },
    { text: 'Your Episodes', icon: RssFeedIcon },
    { text: 'Discover', icon: LightbulbIcon },
  ];

  return (
    <Box
      sx={{
        gridArea: 'sidebar',
        bgcolor: theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        pb: 2,
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          🎵 Media Player
        </Typography>
      </Box>

      <List component="nav" sx={{ mb: 2 }}>
        {primaryNavItems.map((item) => (
          <ListItemButton
            key={item.text}
            selected={currentView === item.view}
            onClick={() => onSelectView(item.view)}
            sx={{
              py: 1,
              px: 2,
              '&.Mui-selected': {
                bgcolor: theme.palette.action.selected,
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                },
              },
              color: theme.palette.text.primary,
              '& .MuiListItemIcon-root': {
                color: 'inherit',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
              <item.icon />
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{ fontWeight: 'bold' }}
            />
          </ListItemButton>
        ))}
      </List>

      <Divider
        variant="middle"
        sx={{ my: 1, borderColor: theme.palette.divider }}
      />

      <List component="nav">
        {secondaryNavItems.map((item) => (
          <ListItemButton
            key={item.text}
            sx={{ py: 1, px: 2, color: theme.palette.text.primary }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
              <item.icon />
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>

      <Divider
        variant="middle"
        sx={{ my: 1, borderColor: theme.palette.divider }}
      />

      <Box sx={{ mt: 2, px: 2 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 'bold',
            mb: 1,
            textTransform: 'uppercase',
            color: theme.palette.text.secondary,
          }}
        >
          Playlists
        </Typography>
        <List dense>
          {playlists.length === 0 ? (
            <ListItemButton
              sx={{ py: 0.5, px: 1, color: theme.palette.text.secondary }}
            >
              <ListItemText primary="No playlists yet" />
            </ListItemButton>
          ) : (
            playlists.map((playlist) => (
              <ListItemButton
                key={playlist.id}
                sx={{ py: 0.5, px: 1, color: theme.palette.text.primary }}
                onClick={() => onSelectView('library')}
              >
                <ListItemText primary={playlist.name} />
              </ListItemButton>
            ))
          )}
        </List>
      </Box>
    </Box>
  );
};

export default SpotifySidebar;
