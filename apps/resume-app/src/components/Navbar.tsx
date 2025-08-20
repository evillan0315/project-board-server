import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import { handleLogout } from '@/services/authService';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import AccountCircle from '@mui/icons-material/AccountCircle';
import CircularProgress from '@mui/material/CircularProgress';

const Navbar: React.FC = () => {
  const { isLoggedIn, user, loading } = useStore(authStore);
  const navigate = useNavigate();

  const onLogout = async () => {
    await handleLogout();
    // Optionally navigate to login or home page after logout
    navigate('/login');
  };

  return (
    <AppBar position="static" color="primary" sx={{ bgcolor: 'var(--tw-colors-blue-600)' }}>
      <Toolbar className="flex justify-between items-center max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}
        >
          Resume AI
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {loading ? (
            <CircularProgress size={24} sx={{ color: 'white' }} />
          ) : isLoggedIn ? (
            <>
              <AccountCircle sx={{ color: 'white' }} />
              <Typography
                variant="body1"
                sx={{ color: 'white', display: { xs: 'none', sm: 'block' } }}
              >
                {user?.name || user?.email || 'User'}
              </Typography>
              <Button color="inherit" onClick={onLogout} sx={{ fontWeight: 'bold' }}>
                Logout
              </Button>
            </>
          ) : (
            <Button color="inherit" component={Link} to="/login" sx={{ fontWeight: 'bold' }}>
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
