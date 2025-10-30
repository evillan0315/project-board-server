import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { authStore, logout } from '@/stores/authStore';
import { toggleTheme } from '@/stores/snackbarStore'; // Using snackbarStore for now, will replace with proper themeStore
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { themeStore } from '@/stores/snackbarStore';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user } = useStore(authStore);
  const { mode } = useStore(themeStore);

  const handleLogout = () => {
    logout();
  };

  return (
    <AppBar position='static'>
      <Toolbar className='justify-between'>
        <Typography variant='h6' component='div' sx={{ flexGrow: 1 }}>
          <Link to='/' className='text-white no-underline hover:underline'>
            Project Planner
          </Link>
        </Typography>
        <Box className='flex items-center space-x-4'>
          <Button color='inherit' onClick={toggleTheme} sx={{ minWidth: 'unset', padding: '8px' }}>
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </Button>
          {isAuthenticated ? (
            <>
              <Typography variant='body1' className='hidden sm:block'>
                Welcome, {user?.username || user?.email}!
              </Typography>
              <Button color='inherit' onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Button color='inherit' component={Link} to='/login'>
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
