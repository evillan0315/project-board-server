import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import HomeIcon from '@mui/icons-material/Home';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '@/components/auth/hooks/useAuth';

export const Navbar: React.FC = () => {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AppBar position="static" color="primary" elevation={1} sx={{ bgcolor: 'primary.dark' }}>
      <Toolbar className="justify-between">
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}
        >
          Vite Starter App
        </Typography>

        <Box className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <Button
                color="inherit"
                startIcon={<HomeIcon />}
                component={RouterLink}
                to="/"
              >
                Home
              </Button>
              <Button color="inherit" startIcon={<AccountCircleIcon />}>
                {user?.email || 'Profile'}
              </Button>
              <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
                Logout
              </Button>
            </>
          ) : (
            <Button
              color="inherit"
              startIcon={<LoginIcon />}
              component={RouterLink}
              to="/login"
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
