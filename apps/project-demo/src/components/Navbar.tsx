import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { useAuth } from '../hooks/useAuth';

export const Navbar: React.FC = () => {
  const { isLoggedIn, logout, user } = useAuth(); // Destructure user as well

  const navbarLinkSx = {
    color: 'inherit',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  };

  return (
    <Box
      component="nav"
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: 2,
        backgroundColor: 'background.paper',
        boxShadow: 1,
      }}
      className="bg-white dark:bg-gray-800 shadow-sm"
    >
      <RouterLink to="/" style={{ textDecoration: 'none' }}>
        <Button sx={{ mr: 2 }} color="inherit">
          Home
        </Button>
      </RouterLink>
      {isLoggedIn ? (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body1" sx={{ mr: 2, color: 'text.secondary' }}>
            Welcome, {user?.firstName || user?.email || 'User'}
          </Typography>
          <Button onClick={logout} color="error" variant="contained">
            Logout
          </Button>
        </Box>
      ) : (
        <RouterLink to="/login" style={{ textDecoration: 'none' }}>
          <Button color="primary" variant="contained">
            Login
          </Button>
        </RouterLink>
      )}
    </Box>
  );
};
