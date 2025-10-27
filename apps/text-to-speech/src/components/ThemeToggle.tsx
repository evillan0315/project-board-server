import React from 'react';
import { IconButton } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useStore } from '@nanostores/react';
import { themeAtom, toggleTheme } from '../stores/themeStore';

export const ThemeToggle: React.FC = () => {
  const { theme } = useStore(themeAtom);

  return (
    <IconButton onClick={toggleTheme} color="inherit">
      {theme === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
};
