import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Link,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import { useAuth } from '../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isLoggedIn) {
      navigate('/'); // Redirect to home if already logged in
    }
  }, [isLoggedIn, navigate]);

  const handleLogin = async (event: React.FormEvent) => {
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
    // In a production environment, the backend's `FRONTEND_URL` environment variable
    // should be correctly configured to generate the full OAuth callback URL.
    // The frontend should not hardcode or infer its own port for this.
    window.location.href = `/api/auth/google`;
  };

  const handleGitHubLogin = () => {
    // Same as Google login, rely on backend's `FRONTEND_URL` for callback construction.
    window.location.href = `/api/auth/github`;
  };

  const paperSx = {
    p: 4,
    mb: 3,
    borderRadius: 2,
    boxShadow: 3,
    className: 'bg-white dark:bg-gray-800',
  };

  return (
    <Box className="flex flex-col items-center justify-center p-6 max-w-md mx-auto min-h-[calc(100vh-128px)]">
      <Typography
        variant="h4"
        component="h1"
        sx={{ mb: 3 }}
        className="font-bold text-gray-800 dark:text-gray-100"
      >
        Login
      </Typography>

      <Paper sx={paperSx}>
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleLogin}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'primary.light' },
                '&:hover fieldset': { borderColor: 'primary.main' },
                '&.Mui-focused fieldset': { borderColor: 'primary.dark' },
              },
              '& .MuiInputLabel-root': { color: 'text.secondary' },
              '& .MuiInputBase-input': { color: 'text.primary' },
              mb: 2,
            }}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'primary.light' },
                '&:hover fieldset': { borderColor: 'primary.main' },
                '&.Mui-focused fieldset': { borderColor: 'primary.dark' },
              },
              '& .MuiInputLabel-root': { color: 'text.secondary' },
              '& .MuiInputBase-input': { color: 'text.primary' },
              mb: 2,
            }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2, mb: 3 }}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            className="py-3 text-lg font-bold"
          >
            Login with Email
          </Button>
        </form>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            disabled={loading}
            sx={{ borderColor: 'grey.400', color: 'text.primary' }}
          >
            Sign in with Google
          </Button>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<GitHubIcon />}
            onClick={handleGitHubLogin}
            disabled={loading}
            sx={{ borderColor: 'grey.400', color: 'text.primary' }}
          >
            Sign in with GitHub
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
          Don't have an account?{' '}
          <Link
            component={RouterLink}
            to="/register"
            sx={{
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Register
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
};
