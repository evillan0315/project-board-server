import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
export const Navbar = () => {
    const { isLoggedIn, logout, user } = useAuth(); // Destructure user as well
    return (_jsxs(Box, { component: "nav", sx: {
            display: 'flex',
            justifyContent: 'flex-end',
            padding: 2,
            backgroundColor: 'background.paper',
            boxShadow: 1,
        }, className: "bg-white dark:bg-gray-800 shadow-sm", children: [_jsx(RouterLink, { to: "/", style: { textDecoration: 'none' }, children: _jsx(Button, { sx: { mr: 2 }, color: "inherit", children: "Home" }) }), isLoggedIn ? (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [_jsxs(Typography, { variant: "body1", sx: { mr: 2, color: 'text.secondary' }, children: ["Welcome, ", user?.firstName || user?.email || 'User'] }), _jsx(Button, { onClick: logout, color: "error", variant: "contained", children: "Logout" })] })) : (_jsx(RouterLink, { to: "/login", style: { textDecoration: 'none' }, children: _jsx(Button, { color: "primary", variant: "contained", children: "Login" }) }))] }));
};
