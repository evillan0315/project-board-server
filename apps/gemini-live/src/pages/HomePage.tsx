import React from 'react';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';

const HomePage: React.FC = () => {
  const { isLoggedIn, user } = useStore(authStore);

  return (
    <Paper elevation={2} className="p-6 mt-6 bg-blue-50/50 border border-blue-200">
      <Typography variant="h5" className="!font-bold !text-blue-800 mb-4">
        Welcome to the Gemini Live App!
      </Typography>
      <Typography variant="body1" className="text-gray-700 mb-4">
        This application demonstrates real-time voice and video interactions with Google Gemini Live
        API, along with Google and GitHub OAuth2 authentication.
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
          <Box className="mt-4 flex justify-center">
            <Button variant="contained" component={Link} to="/gemini-live">
              Start a Gemini Live Session
            </Button>
          </Box>
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
          Key Features:
        </Typography>
        <ul className="list-disc list-inside text-gray-700">
          <li>Real-time Audio Streaming & AI Voice Responses</li>
          <li>Live Video Feed (for potential future video input)</li>
          <li>Google & GitHub OAuth2 Authentication</li>
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
