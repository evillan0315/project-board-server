import React from 'react';
import { IconButton } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useStore } from '@nanostores/react';
import { themeStore, toggleTheme } from '../stores/themeStore'; // Corrected import name to themeStore

export const ThemeToggle: React.FC = () => {
  const { theme } = useStore(themeStore); // Corrected store usage

  return (
    <IconButton onClick={toggleTheme} color="inherit">
      {theme === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
};
