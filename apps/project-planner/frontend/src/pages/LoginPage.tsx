import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';

const LoginPage: React.FC = () => {
  const handleGoogleLogin = () => {
    window.location.href = `http://localhost:5000/api/auth/google`;
  };

  const handleGithubLogin = () => {
    window.location.href = `http://localhost:5000/api/auth/github`;
  };

  return (
    <Container maxWidth='sm' className='flex items-center justify-center min-h-screen-minus-navbar'>
      <Paper elevation={3} className='p-8 flex flex-col items-center space-y-6 w-full max-w-md'>
        <Typography variant='h4' component='h1' gutterBottom>
          Login
        </Typography>
        <Typography variant='body1' align='center' paragraph>
          Sign in to access the AI Project Planner.
        </Typography>
        <Button
          variant='contained'
          color='primary'
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          fullWidth
          size='large'
        >
          Sign in with Google
        </Button>
        <Button
          variant='contained'
          color='inherit'
          startIcon={<GitHubIcon />}
          onClick={handleGithubLogin}
          fullWidth
          size='large'
          sx={{
            backgroundColor: '#24292e',
            color: 'white',
            '&:hover': { backgroundColor: '#33363a' },
          }}
        >
          Sign in with GitHub
        </Button>
      </Paper>
    </Container>
  );
};

export default LoginPage;
