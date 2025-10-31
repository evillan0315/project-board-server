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
import ThemeSwitcher from './ui/ThemeSwitcher';

const Navbar: React.FC = () => {
  const { isLoggedIn, user, loading } = useStore(authStore);
  const navigate = useNavigate();

  const onLogout = async () => {
    await handleLogout();
    navigate('/login');
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar className="flex justify-between items-center max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-2">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Box className="flex flex-col items-start">
            <Typography
              variant="h5"
              component="h1"
              className="!font-extrabold !text-gray-50 dark:!text-gray-100 transition-colors duration-300"
            >
              Resume AI Assistant
            </Typography>
            <Typography
              variant="body2"
              className="!text-gray-300 dark:!text-gray-400 transition-colors duration-300 hidden sm:block"
            >
              Optimize, Generate, and Enhance Your Resume with AI
            </Typography>
          </Box>
        </Link>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ThemeSwitcher />
          {loading ? (
            <CircularProgress size={24} sx={{ color: 'white' }} />
          ) : isLoggedIn ? (
            <>
              <AccountCircle sx={{ color: 'inherit' }} />
              <Typography
                variant="body1"
                sx={{ color: 'inherit', display: { xs: 'none', sm: 'block' } }}
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
