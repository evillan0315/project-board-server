import React from 'react';
import { Box, useTheme } from '@mui/material';
import SpotifyHomePage from './SpotifyHomePage';
import SpotifySearchPage from './SpotifySearchPage';
import SpotifyLibraryPage from './SpotifyLibraryPage';
import SpotifySettingsPage from './SpotifySettingsPage'; // New: Import SpotifySettingsPage

interface SpotifyMainContentProps {
  currentView: 'home' | 'search' | 'library' | 'settings'; // New: Added 'settings' view
}

const SpotifyMainContent: React.FC<SpotifyMainContentProps> = ({
  currentView,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        gridArea: 'main',
        bgcolor: theme.palette.background.default,
        overflowY: 'auto',
        p: 3,
      }}
    >
      {currentView === 'home' && <SpotifyHomePage />}
      {currentView === 'search' && <SpotifySearchPage />}
      {currentView === 'library' && <SpotifyLibraryPage />}
      {currentView === 'settings' && <SpotifySettingsPage />}{' '}
      {/* New: Render Settings page */}
    </Box>
  );
};

export default SpotifyMainContent;
