import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Button, TextField, Typography, CircularProgress, Alert, Paper, Link, } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import { useAuth } from '../hooks/useAuth';
export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading, error, isLoggedIn } = useAuth();
    const navigate = useNavigate();
    React.useEffect(() => {
        if (isLoggedIn) {
            navigate('/'); // Redirect to home if already logged in
        }
    }, [isLoggedIn, navigate]);
    const handleLogin = async (event) => {
        event.preventDefault();
        if (!email || !password) {
            return;
        }
        const result = await login({ email, passwordHash: password }); // Backend expects passwordHash
        if (result.success) {
            // Handled by useAuth hook navigation
        }
    };
    const handleGoogleLogin = () => {
        window.location.href = `/api/auth/google?cli_port=${import.meta.env.VITE_FRONTEND_PORT}`;
    };
    const handleGitHubLogin = () => {
        window.location.href = `/api/auth/github?cli_port=${import.meta.env.VITE_FRONTEND_PORT}`;
    };
    const paperSx = {
        p: 4,
        mb: 3,
        borderRadius: 2,
        boxShadow: 3,
        className: 'bg-white dark:bg-gray-800',
    };
    return (_jsxs(Box, { className: "flex flex-col items-center justify-center p-6 max-w-md mx-auto min-h-[calc(100vh-128px)]", children: [_jsx(Typography, { variant: "h4", component: "h1", sx: { mb: 3 }, className: "font-bold text-gray-800 dark:text-gray-100", children: "Login" }), _jsxs(Paper, { sx: paperSx, children: [error && (_jsx(Alert, { severity: "error", sx: { mb: 2 }, className: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200", children: error })), _jsxs("form", { onSubmit: handleLogin, children: [_jsx(TextField, { label: "Email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), margin: "normal", required: true, disabled: loading, sx: {
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { borderColor: 'primary.light' },
                                        '&:hover fieldset': { borderColor: 'primary.main' },
                                        '&.Mui-focused fieldset': { borderColor: 'primary.dark' },
                                    },
                                    '& .MuiInputLabel-root': { color: 'text.secondary' },
                                    '& .MuiInputBase-input': { color: 'text.primary' },
                                    mb: 2,
                                } }), _jsx(TextField, { label: "Password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), margin: "normal", required: true, disabled: loading, sx: {
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { borderColor: 'primary.light' },
                                        '&:hover fieldset': { borderColor: 'primary.main' },
                                        '&.Mui-focused fieldset': { borderColor: 'primary.dark' },
                                    },
                                    '& .MuiInputLabel-root': { color: 'text.secondary' },
                                    '& .MuiInputBase-input': { color: 'text.primary' },
                                    mb: 2,
                                } }), _jsx(Button, { type: "submit", variant: "contained", color: "primary", fullWidth: true, sx: { mt: 2, mb: 3 }, disabled: loading, startIcon: loading ? _jsx(CircularProgress, { size: 20, color: "inherit" }) : null, className: "py-3 text-lg font-bold", children: "Login with Email" })] }), _jsxs(Box, { sx: { display: 'flex', flexDirection: 'column', gap: 2 }, children: [_jsx(Button, { variant: "outlined", fullWidth: true, startIcon: _jsx(GoogleIcon, {}), onClick: handleGoogleLogin, disabled: loading, sx: { borderColor: 'grey.400', color: 'text.primary' }, children: "Sign in with Google" }), _jsx(Button, { variant: "outlined", fullWidth: true, startIcon: _jsx(GitHubIcon, {}), onClick: handleGitHubLogin, disabled: loading, sx: { borderColor: 'grey.400', color: 'text.primary' }, children: "Sign in with GitHub" })] }), _jsxs(Typography, { variant: "body2", sx: { mt: 3, textAlign: 'center' }, children: ["Don't have an account?", ' ', _jsx(Link, { component: RouterLink, to: "/register", sx: {
                                    textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline' },
                                }, children: "Register" })] })] })] }));
};
