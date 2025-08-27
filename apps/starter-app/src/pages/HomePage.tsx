import React from 'react';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

const HomePage: React.FC = () => {
  const { isLoggedIn, user } = useStore(authStore);

  return (
    <Paper elevation={2} className="p-6 mt-6 bg-blue-50/50 border border-blue-200">
      <Typography variant="h5" className="!font-bold !text-blue-800 mb-4">
        Welcome to the Starter App!
      </Typography>
      <Typography variant="body1" className="text-gray-700 mb-4">
        This is a basic template demonstrating authentication using JWT and OAuth2 (Google &
        GitHub).
      </Typography>

      {isLoggedIn ? (
        <Box className="mt-4 p-4 bg-blue-100 rounded-md shadow-inner">
          <Typography variant="h6" className="!font-semibold !text-blue-900 mb-2">
            You are logged in!
          </Typography>
          <Typography variant="body1" className="text-gray-800">
            Welcome, {user?.name || user?.username || user?.email || 'User'}! Your role is{' '}
            {user?.role || 'USER'}.{user?.provider && `You signed in with ${user.provider}.`}
          </Typography>
        </Box>
      ) : (
        <Box className="mt-4 p-4 bg-yellow-100 rounded-md shadow-inner">
          <Typography variant="h6" className="!font-semibold !text-yellow-900 mb-2">
            You are not logged in.
          </Typography>
          <Typography variant="body1" className="text-gray-800">
            Please log in using the 'Login' button in the navigation bar to experience the
            authentication features.
          </Typography>
        </Box>
      )}

      <Box className="mt-6">
        <Typography variant="h6" className="!font-semibold !text-gray-800 mb-2">
          Features:
        </Typography>
        <ul className="list-disc list-inside text-gray-700">
          <li>User Authentication (JWT, OAuth2 with Google & GitHub)</li>
          <li>Client-side routing with React Router DOM</li>
          <li>Global state management with Nanostores</li>
          <li>Styled with Tailwind CSS and Material-UI components</li>
          <li>Type-safe development with TypeScript</li>
        </ul>
      </Box>
    </Paper>
  );
};

export default HomePage;
