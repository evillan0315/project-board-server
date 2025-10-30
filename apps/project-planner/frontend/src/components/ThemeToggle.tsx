import React from 'react';
import { IconButton } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useStore } from '@nanostores/react';
import { themeStore, toggleTheme } from '@/stores/snackbarStore'; // Using snackbarStore for now, will replace with proper themeStore

export const ThemeToggle: React.FC = () => {
  const { mode } = useStore(themeStore);

  return (
    <IconButton onClick={toggleTheme} color='inherit' size='large'>
      {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
};
