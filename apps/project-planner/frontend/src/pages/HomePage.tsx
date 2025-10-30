import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <Box
      className='flex flex-col items-center justify-center min-h-screen-minus-navbar'
      sx={{
        py: 8,
        textAlign: 'center',
      }}
    >
      <Typography variant='h2' component='h1' gutterBottom>
        Welcome to the AI Project Planner!
      </Typography>
      <Typography variant='h5' component='p' paragraph sx={{ maxWidth: '800px' }}>
        Harness the power of AI to streamline your project management. Generate plans, manage tasks, and automate workflows with intelligent assistance.
      </Typography>
      <Button
        component={Link}
        to='/planner'
        variant='contained'
        color='primary'
        size='large'
        sx={{ mt: 4 }}
      >
        Get Started
      </Button>
    </Box>
  );
};

export default HomePage;
