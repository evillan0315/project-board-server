import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import {
  authStore,
  loginSuccess,
  setError as setAuthError,
} from '@/stores/authStore';
import { loginLocal } from '@/api/auth'; // Changed to '@/api/auth'
import { APP_NAME } from '@/constants/app'; // Import APP_NAME from app.ts

import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import TextField from '@/components/ui/TextField'; // Use the custom TextField
import { useTheme } from '@mui/material/styles';

import type { UserProfile } from '@/types/auth';

const GOOGLE_AUTH_INIT_URL = '/api/auth/google'; // Backend endpoint to initiate Google OAuth
const GITHUB_AUTH_INIT_URL = '/api/auth/github'; // Backend endpoint to initiate GitHub OAuth

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error: authStoreError, isLoggedIn } = useStore(authStore);
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Handle OAuth callback parameters from URL on component mount
  useEffect(() => {
    if (isLoggedIn) {
      // If already logged in (e.g., through a prior checkAuthStatus call), redirect away from login page
      navigate('/', { replace: true });
      return;
    }

    const action = searchParams.get('action');
    const accessToken = searchParams.get('accessToken'); // Note: This accessToken is for client-side use if needed, backend sets HTTP-only cookie
    const userId = searchParams.get('userId');
    const userEmail = searchParams.get('userEmail');
    const userName = searchParams.get('userName');
    const userImage = searchParams.get('userImage');
    const userRole = searchParams.get('userRole');
    const username = searchParams.get('username');
    const provider = searchParams.get('provider');
    const err = searchParams.get('error');

    if (action === 'success' && accessToken && userId && userEmail) {
      const user: UserProfile = {
        id: userId,
        email: userEmail,
        name: userName ? decodeURIComponent(userName) : undefined,
        image: userImage ? decodeURIComponent(userImage) : undefined,
        role: (userRole as UserProfile['role']) || 'USER',
        username: username ? decodeURIComponent(username) : undefined,
        provider: (provider as UserProfile['provider']) || undefined,
        // accessToken is not stored in user profile for HTTP-only cookie use case, but might be passed for CLI
      };
      loginSuccess(user, accessToken); // Pass token to loginSuccess if needed for client-side storage
      navigate('/', { replace: true }); // Redirect to home page upon successful login
    } else if (err) {
      setAuthError(decodeURIComponent(err)); // Display error message from backend
    } else if (
      !loading &&
      !isLoggedIn &&
      !authStoreError &&
      (searchParams.toString() === '' || searchParams.get('action') === null)
    ) {
      // Clear any previous error if navigating to login page without specific error/success params
      setAuthError(null);
    }
  }, [searchParams, navigate, loading, isLoggedIn, authStoreError]);

  // Clear local error when authStoreError changes
  useEffect(() => {
    if (authStoreError) {
      setLocalError(null); // Prioritize authStoreError, clear local validation errors
    }
  }, [authStoreError]);

  // Function to initiate OAuth login by redirecting to backend endpoint
  const handleOAuthLogin = (url: string) => {
    // Append current client-side port to URL for backend to use in redirect if needed
    // This helps the backend know where to redirect the CLI client or handle development setups.
    const cliPort = window.location.port;
    const finalUrl = cliPort ? `${url}?cli_port=${cliPort}` : url;
    window.location.href = finalUrl;
  };

  const handleLocalLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null); // Clear previous local errors
    setAuthError(null); // Clear previous auth store errors

    if (!email || !password) {
      setLocalError('Email and password are required.');
      return;
    }

    try {
      await loginLocal({ email, password });
      // Login successful, authStore should be updated and redirected by useEffect
      // No explicit navigate here, let useEffect handle it for consistency
    } catch (e) {
      // Error message is already set in authStore via loginLocal
      // No need to setLocalError here, as authStoreError will be updated and reflected
    }
  };

  if (loading) {
    return (
      <Container
        maxWidth="sm"
        className="flex justify-center items-center min-h-[50vh]"
      >
        <CircularProgress />
      </Container>
    );
  }

  const displayError = localError || authStoreError;

  return (
    <Container className="login-container" maxWidth="sm" sx={{ mt: 8 }}>
      <Paper
        elevation={3}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 4,
          borderRadius: 6,
          boxShadow: 1,
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Typography
          component="h1"
          variant="h5"
          sx={{ mb: 3, fontWeight: 'bold', color: theme.palette.text.primary }}
        >
          Sign In to {APP_NAME}
        </Typography>

        {displayError && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {displayError}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleLocalLogin}
          sx={{ mt: 1, width: '100%' }}
        >
          <TextField
            margin="normal"
            color="primary"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <Button
            id="login-submit-btn"
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={loading || !email || !password}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Sign In'
            )}
          </Button>
          <Box className="flex justify-between items-center w-full">
            <Link
              to="/register"
              className="block text-center mt-2"
              style={{
                color: theme.palette.text.secondary,
                textDecoration: 'underline',
              }}
            >
              Don't have an account? Register
            </Link>
            <Link
              to="/forgot-password"
              className="block text-center mt-2"
              style={{
                color: theme.palette.text.secondary,
                textDecoration: 'underline',
              }}
            >
              Forgot password?
            </Link>
          </Box>
        </Box>

        <Divider
          sx={{
            width: '100%',
            my: 3,
            '&::before, &::after': { borderColor: theme.palette.divider },
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            OR CONTINUE WITH
          </Typography>
        </Divider>

        <Button
          variant="outlined"
          fullWidth
          sx={{
            mb: 2,
            py: 1.5,
            borderColor: theme.palette.divider,
            color: theme.palette.text.primary,
          }}
          startIcon={<GoogleIcon />}
          onClick={() => handleOAuthLogin(GOOGLE_AUTH_INIT_URL)}
          disabled={loading}
        >
          Sign in with Google
        </Button>
        <Button
          variant="outlined"
          fullWidth
          sx={{
            mb: 0,
            py: 1.5,
            borderColor: theme.palette.divider,
            color: theme.palette.text.primary,
          }}
          startIcon={<GitHubIcon />}
          onClick={() => handleOAuthLogin(GITHUB_AUTH_INIT_URL)}
          disabled={loading}
        >
          Sign in with GitHub
        </Button>
      </Paper>
    </Container>
  );
};

export default LoginPage;
