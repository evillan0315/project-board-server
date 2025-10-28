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
  Stack,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver'; // Import the chosen icon
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
    bgcolor: 'background.paper', // Rely on theme for background color
  };

  return (
    <Box className="flex flex-col items-center justify-center p-6 max-w-md mx-auto min-h-[calc(100vh-128px)]">
      {/* Logo Section */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ mb: 4, color: 'primary.main' }}
      >
        <RecordVoiceOverIcon sx={{ fontSize: 60 }} />
        <Typography variant="h3" component="div" className="font-extrabold">
          Gemini TTS
        </Typography>
      </Stack>

      <Paper sx={paperSx}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
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

        <Typography variant="body2" sx={{ mt: 3, textAlign: 'center', color: 'text.secondary' }}>
          Don't have an account?{' '}
          <Link
            component={RouterLink}
            to="/register"
            sx={{
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
              color: 'primary.main',
            }}
          >
            Register
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
};
