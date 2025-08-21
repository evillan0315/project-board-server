import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { checkAuthStatus } from '@/services/authService';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

const Layout: React.FC = () => {
  const { loading: authLoading } = useStore(authStore);

  useEffect(() => {
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
      <header className="w-full max-w-4xl mb-8 mt-8">
        <Typography variant="h1" color="text.primary" align="center">
          JSON Validator & Fixer
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 1 }}>
          Validate and repair your JSON with ease.
        </Typography>
      </header>
      <Paper
        component="main"
        elevation={3}
        sx={{
          flexGrow: 1,
          width: '100%',
          maxWidth: '4xl',
          bgcolor: 'background.paper',
          borderRadius: 2,
          p: { xs: 3, sm: 4 },
          mb: 4,
        }}
      >
        <Outlet />
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
          © 2024 JSON Fixer & Validator. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout;
