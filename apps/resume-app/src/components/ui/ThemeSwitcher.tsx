import React from 'react';
import { useStore } from '@nanostores/react';
import { themeStore, toggleThemeMode } from '@/stores/themeStore';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Brightness4Icon from '@mui/icons-material/Brightness4'; // Dark mode icon
import Brightness7Icon from '@mui/icons-material/Brightness7'; // Light mode icon

const ThemeSwitcher: React.FC = () => {
  const { mode } = useStore(themeStore);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <IconButton sx={{ ml: 1 }} onClick={toggleThemeMode} color="inherit" title="Toggle theme">
        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Box>
  );
};

export default ThemeSwitcher;
