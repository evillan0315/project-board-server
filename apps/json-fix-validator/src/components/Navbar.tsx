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
    <AppBar position="static"  enableColorOnDark>
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '4xl',
          mx: 'auto',
          width: '100%',
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}
        >
          Utility apps
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ThemeSwitcher />
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : isLoggedIn ? (
            <>
              <AccountCircle sx={{ color: 'inherit' }} />
              <Typography
                variant="body1"
                color="inherit"
                sx={{ display: { xs: 'none', sm: 'block' } }}
              >
                {user?.name || user?.email || 'User'}
              </Typography>
              <Button
                color="inherit"
                onClick={onLogout}
                sx={{ fontWeight: 'bold' }}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              color="inherit"
              component={Link}
              to="/login"
              sx={{ fontWeight: 'bold' }}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
