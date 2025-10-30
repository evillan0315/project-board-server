import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authStore, fetchUserProfile, logoutUser } from '@/components/auth/stores/authStore'; // Adjusted import path
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  useEffect(() => {
    const token = searchParams.get('accessToken');
    const error = searchParams.get('error');
    const handleAuthResult = async () => {
      if (token) {
        try {
          authStore.set({
            isLoggedIn: true,
            token: token,
            user: null,
            loading: true,
            error: null,
          });
          await fetchUserProfile();
//           console.warn('JWT Token received and stored, user profile fetched.');
          navigate('/');
        } catch (profileError) {
//           console.error('Failed to fetch user profile after token:', profileError);
          logoutUser();
          navigate(
            '/login?error=' +
              encodeURIComponent(
                (profileError as Error).message || 'Failed to retrieve user profile.',
              ),
          );
        }
      } else if (error) {
//         console.error('Authentication error:', error);
        authStore.set({
          ...authStore.get(),
          error: error,
          loading: false,
        });
        navigate('/login?error=' + encodeURIComponent(error));
      } else {
//         console.warn('AuthCallback accessed without token or error param. Redirecting to login.');
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
