import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import { ThemeToggle } from './ThemeToggle';
import { Navbar } from './Navbar';
export const Layout = ({ children }) => {
    return (_jsxs(Box, { sx: { display: 'flex', flexDirection: 'column', minHeight: '100vh' }, className: "bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-200", children: [_jsx(AppBar, { position: "static", className: "bg-sky-600 dark:bg-sky-950 shadow-md", children: _jsxs(Toolbar, { children: [_jsx(Typography, { variant: "h6", component: "div", sx: { flexGrow: 1 }, children: "Gemini TTS Generator" }), _jsx(ThemeToggle, {})] }) }), _jsx(Navbar, {}), _jsx(Box, { component: "main", sx: { flexGrow: 1, p: 3 }, children: children })] }));
};
