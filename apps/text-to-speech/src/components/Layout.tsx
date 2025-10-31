import type { ReactNode } from 'react';
import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button, Stack } from '@mui/material';
import { ThemeToggle } from './ThemeToggle';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import AddRoadIcon from '@mui/icons-material/AddRoad'; // New: Import AddRoadIcon for Planner

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isLoggedIn, logout, user } = useAuth();

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      className="transition-colors duration-200"
    >
      <AppBar position="static" className="shadow-md">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Left section: App Logo and Title as a Home Link */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <RecordVoiceOverIcon sx={{ fontSize: 30 }} /> { /* Adjusted size for navbar */}
                <Typography variant="h6" component="div" sx={{ color: 'inherit' }}>
                  Gemini AI Suite
                </Typography>
              </Stack>
            </RouterLink>

            {/* New: Navigation links to feature landing pages */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 4 }}>
              <Button component={RouterLink} to="/tts" color="inherit" sx={{ mr: 1 }}
                startIcon={<RecordVoiceOverIcon fontSize="small" />} size="small">
                TTS
              </Button>
              <Button component={RouterLink} to="/planner" color="inherit"
                startIcon={<AddRoadIcon fontSize="small" />} size="small">
                AI Planner
              </Button>
            </Box>
          </Box>

          {/* Right section: Auth controls and Theme Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isLoggedIn ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ mr: 2, color: 'inherit' }}>
                  Welcome, {user?.firstName || user?.email || 'User'}
                </Typography>
                <Button
                  onClick={logout}
                  color="inherit"
                  variant="text" // Changed to text variant for smaller appearance
                  size="small" // Explicitly set size to small
                  startIcon={<LogoutIcon fontSize="small" />} // Added Logout icon
                  sx={{ mr: 1 }}
                >
                  Logout
                </Button>
              </Box>
            ) : (
              <RouterLink to="/login" style={{ textDecoration: 'none' }}>
                <Button
                  color="inherit"
                  variant="text" // Changed to text variant for smaller appearance
                  size="small" // Explicitly set size to small
                  startIcon={<LoginIcon fontSize="small" />} // Added Login icon
                  sx={{ mr: 1 }}
                >
                  Login
                </Button>
              </RouterLink>
            )}
            <ThemeToggle />
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
};
