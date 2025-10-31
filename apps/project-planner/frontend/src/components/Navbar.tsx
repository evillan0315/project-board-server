import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { authStore, logoutUser } from '../stores/authStore';
import { themeStore, toggleTheme } from '../stores/themeStore'; // Corrected import name to themeStore
import { AppBar, Toolbar, Typography, Button, IconButton, Box } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AccountCircle from '@mui/icons-material/AccountCircle';
// import MenuIcon from '@mui/icons-material/Menu'; // Removed as it was commented out

const linkSx = {
  color: 'inherit',
  textDecoration: 'none',
  fontWeight: 'bold',
  '&:hover': {
    textDecoration: 'underline',
  },
};

const Navbar: React.FC = () => {
  const { isAuthenticated, user } = useStore(authStore);
  const { theme: currentTheme } = useStore(themeStore); // Correctly access 'theme' property
  const isDarkMode = currentTheme === 'dark'; // Derive isDarkMode

  return (
    <AppBar position="static" className="shadow-md">
      <Toolbar className="flex justify-between items-center bg-gray-800 text-white p-4">
        <Box className="flex items-center gap-4">
          {/* Removed MenuIcon as it was commented out and likely not in use */}
          <Typography variant="h6" component="div">
            <Link to="/" style={linkSx}>
              Project Planner
            </Link>
          </Typography>
          <Link to="/tts" className="text-white ml-4 hover:underline">
            TTS Generator
          </Link>
          <Link to="/planner" className="text-white ml-4 hover:underline">
            AI Planner
          </Link>
        </Box>

        <Box className="flex items-center gap-2">
          <IconButton onClick={toggleTheme} color="inherit">
            {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>

          {isAuthenticated ? (
            <Box className="flex items-center gap-2">
              <AccountCircle className="text-white" />
              <Typography variant="body1" className="hidden sm:block">
                {user?.email}
              </Typography>
              <Button color="inherit" onClick={logoutUser} className="ml-2">
                Logout
              </Button>
            </Box>
          ) : (
            <Button color="inherit" component={Link} to="/login">
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
