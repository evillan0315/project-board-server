import { jsx as _jsx } from "react/jsx-runtime";
import { IconButton } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useStore } from '@nanostores/react';
import { themeAtom, toggleTheme } from '../stores/themeStore';
export const ThemeToggle = () => {
    const { theme } = useStore(themeAtom);
    return (_jsx(IconButton, { onClick: toggleTheme, color: "inherit", children: theme === 'dark' ? _jsx(LightModeIcon, {}) : _jsx(DarkModeIcon, {}) }));
};
