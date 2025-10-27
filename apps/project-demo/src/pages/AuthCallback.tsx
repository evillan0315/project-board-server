import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authStore, setAuthDetails } from '../stores/authStore';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { authService } from '../api/authService'; // Import authService to fetch profile

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('accessToken');
    const error = searchParams.get('error');

    const handleAuthResult = async () => {
      if (token) {
        try {
          // With the token, fetch the user profile
          authStore.set({
            ...authStore.get(),
            loading: true,
            error: null,
          });
          const user = await authService.getProfile();
          setAuthDetails(token, user);
          console.log('JWT Token received and stored, user profile fetched.');
          navigate('/'); // Redirect to home or dashboard after successful login
        } catch (profileError) {
          console.error('Failed to fetch user profile after token:', profileError);
          authStore.set({
            ...authStore.get(),
            loading: false,
            error: (profileError as Error).message || 'Failed to retrieve user profile.',
          });
          navigate('/login?error=' + encodeURIComponent((profileError as Error).message || 'Failed to retrieve user profile.'));
        }
      } else if (error) {
        console.error('Authentication error:', error);
        authStore.set({
          ...authStore.get(),
          error: error,
          loading: false,
        });
        navigate('/login?error=' + encodeURIComponent(error)); // Redirect to login with error
      } else {
        // No token or error, likely a direct access or incomplete flow
        console.warn('AuthCallback accessed without token or error param. Redirecting to login.');
        navigate('/login');
      }
    };

    handleAuthResult();
  }, [searchParams, navigate]);

  const currentError = authStore.get().error;

  return (
    <Box
      className="flex flex-col items-center justify-center min-h-[50vh]"
      sx={{ mt: 4 }}
    >
      {currentError ? (
        <Alert severity="error" sx={{ mb: 2 }} className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
          Authentication failed: {currentError}
        </Alert>
      ) : (
        <>
          <CircularProgress className="text-sky-600 dark:text-sky-950" />
          <Typography variant="h6" sx={{ mt: 2 }} className="text-gray-700 dark:text-gray-300">
            Authenticating...
          </Typography>
        </>
      )}
    </Box>
  );
};
