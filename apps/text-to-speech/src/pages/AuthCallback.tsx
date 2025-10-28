import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authStore, fetchUserProfile, logoutUser } from '../stores/authStore'; // Import fetchUserProfile and logoutUser
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
// No need to import authService here directly for getProfile as fetchUserProfile handles it

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('accessToken');
    const error = searchParams.get('error');

    const handleAuthResult = async () => {
      if (token) {
        try {
          // 1. Immediately set the received token in the authStore.
          // This makes the token available for subsequent API calls like fetching user profile.
          authStore.set({
            isLoggedIn: true,
            token: token,
            user: null, // User profile is not yet fetched, explicitly set to null
            loading: true,
            error: null,
          });

          // 2. Fetch the user profile using the token now stored in authStore.
          // The fetchUserProfile action will update the user field and set loading to false on success.
          await fetchUserProfile();

          console.warn('JWT Token received and stored, user profile fetched.');
          navigate('/'); // Redirect to home or dashboard after successful login
        } catch (profileError) {
          console.error('Failed to fetch user profile after token:', profileError);
          // If fetching profile fails, it means the token might be invalid or expired.
          // Clear authentication state.
          logoutUser(); // This will clear the token from store and localStorage, and set loading/error.
          navigate(
            '/login?error=' +
              encodeURIComponent(
                (profileError as Error).message || 'Failed to retrieve user profile.',
              ),
          );
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
    <Box className="flex flex-col items-center justify-center min-h-[50vh]" sx={{ mt: 4 }}>
      {currentError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Authentication failed: {currentError}
        </Alert>
      ) : (
        <>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
            Authenticating...
          </Typography>
        </>
      )}
    </Box>
  );
};
