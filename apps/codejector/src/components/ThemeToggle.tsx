import React from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useStore } from '@nanostores/react';
import { themeStore, toggleTheme } from '@/stores/themeStore';

const ThemeToggle: React.FC = () => {
  const { mode } = useStore(themeStore);
  const muiTheme = useTheme(); // Use MUI theme for color context

  const handleToggleTheme = () => {
    toggleTheme();
  };

  return (
    <Tooltip title={`Switch to ${mode === 'light' ? 'Dark' : 'Light'} Mode`}>
      <IconButton
        color="inherit"
        onClick={handleToggleTheme}
        sx={{ color: muiTheme.palette.text.primary }} // Use text primary for icon color
      >
        {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
