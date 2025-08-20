import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { authStore, loginSuccess, setError } from '@/stores/authStore';
import { UserProfile } from '@/types/auth';

import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';

const GOOGLE_AUTH_INIT_URL = '/api/auth/google'; // Backend endpoint to initiate Google OAuth
const GITHUB_AUTH_INIT_URL = '/api/auth/github'; // Backend endpoint to initiate GitHub OAuth

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error, isLoggedIn } = useStore(authStore);

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
        accessToken,
      };
      loginSuccess(user);
      navigate('/', { replace: true }); // Redirect to home page upon successful login
    } else if (err) {
      setError(decodeURIComponent(err)); // Display error message from backend
      n;
    } else if (
      !loading &&
      !isLoggedIn &&
      !error &&
      (searchParams.toString() === '' || searchParams.get('action') === null)
    ) {
      // Clear any previous error if navigating to login page without specific error/success params
      setError(null);
    }
  }, [searchParams, navigate, loading, isLoggedIn, error]);

  // Function to initiate OAuth login by redirecting to backend endpoint
  const handleOAuthLogin = (url: string) => {
    // Append current client-side port to URL for backend to use in redirect if needed
    // This helps the backend know where to redirect the CLI client or handle development setups.
    const cliPort = window.location.port;
    const finalUrl = cliPort ? `${url}?cli_port=${cliPort}` : url;
    window.location.href = finalUrl;
  };

  if (loading) {
    return (
      <Container maxWidth="sm" className="flex justify-center items-center min-h-[50vh]">
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" className="mt-8">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 4,
          borderRadius: 2,
          boxShadow: 3,
          bgcolor: 'background.paper',
        }}
      >
        <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Sign In
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          variant="outlined"
          fullWidth
          sx={{ mb: 2, py: 1.5 }}
          startIcon={<GoogleIcon />}
          onClick={() => handleOAuthLogin(GOOGLE_AUTH_INIT_URL)}
        >
          Sign in with Google
        </Button>
        <Button
          variant="outlined"
          fullWidth
          sx={{ mb: 3, py: 1.5 }}
          startIcon={<GitHubIcon />}
          onClick={() => handleOAuthLogin(GITHUB_AUTH_INIT_URL)}
        >
          Sign in with GitHub
        </Button>

        <Divider sx={{ width: '100%', mb: 3 }}>OR</Divider>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Standard email/password login and registration are not yet implemented on the frontend.
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Please use Google or GitHub to continue.
        </Typography>
      </Box>
    </Container>
  );
};

export default LoginPage;
