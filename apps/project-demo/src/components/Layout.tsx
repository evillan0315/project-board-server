import type { ReactNode } from 'react';
import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import { ThemeToggle } from './ThemeToggle';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      className="bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-200"
    >
      <AppBar position="static" className="bg-sky-600 dark:bg-sky-950 shadow-md">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Gemini TTS Generator
          </Typography>
          <ThemeToggle />
        </Toolbar>
      </AppBar>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
};
