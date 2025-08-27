// src/components/Layout.tsx
import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom'; // Import Outlet
import Navbar from './Navbar';
import { checkAuthStatus } from '@/services/authService';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';


// Remove the children prop as React Router's Outlet will render nested routes
export default function Layout() {

  const { loading: authLoading } = useStore(authStore);

  useEffect(() => {
    // Check authentication status on layout mount
    checkAuthStatus();
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
        alignItems: 'center',
      }}
    >
      <Navbar />
      {authLoading && (
        <Box sx={{ width: '100%', position: 'sticky', top: 0, zIndex: 1100 }}>
          <LinearProgress />
        </Box>
      )}

      <Paper
        component="main"
        elevation={3}
        sx={{
          flexGrow: 1,
          width: '100%',
          maxWidth: '4xl',
        }}
      >
        <Outlet /> {/* This is where the content of nested routes will be rendered */}
      </Paper>
      <Box
        component="footer"
        sx={{
          width: '100%',
          maxWidth: '4xl',
          mt: 'auto',
          py: 2,
          textAlign: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          © 2025 JSON Fixer & Validator. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
