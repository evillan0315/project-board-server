import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { login } from '@/stores/authStore';
import { Loading } from '@/components/Loading';
import { Box, Typography } from '@mui/material';
import { showSnackbar } from '@/stores/snackbarStore';

const AuthCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const error = params.get('error');

        if (error) {
          showSnackbar(`Authentication failed: ${error}`, 'error');
          navigate('/login');
          return;
        }

        if (token) {
          const user = await authService.getMe(token);
          login(user, token);
          showSnackbar('Logged in successfully!', 'success');
          navigate('/planner');
        } else {
          showSnackbar('No authentication token found.', 'error');
          navigate('/login');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        showSnackbar(`Authentication failed: ${(err as Error).message}`, 'error');
        navigate('/login');
      }
    };

    handleCallback();
  }, [location, navigate]);

  return (
    <Box className='flex flex-col items-center justify-center min-h-screen-minus-navbar'>
      <Loading />
      <Typography variant='h6' sx={{ mt: 2 }}>Authenticating...</Typography>
    </Box>
  );
};

export default AuthCallback;
