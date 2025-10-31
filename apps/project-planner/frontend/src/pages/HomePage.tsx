import React from 'react';
import { Layout } from '~/components/Layout';
import { Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <Layout>
      <Box className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
        <Typography variant="h3" component="h1" gutterBottom className="font-bold text-blue-600 dark:text-blue-400">
          Welcome to the Project Planner
        </Typography>
        <Typography variant="h6" component="p" className="mb-8 text-gray-700 dark:text-gray-300">
          Your AI-powered assistant for project planning and code generation.
        </Typography>
        <Box className="flex gap-4">
          <Button variant="contained" color="primary" component={Link} to="/planner" size="large">
            Start Planning
          </Button>
          <Button variant="outlined" color="secondary" component={Link} to="/tts" size="large">
            Try TTS Generator
          </Button>
        </Box>
      </Box>
    </Layout>
  );
};

export default HomePage;
