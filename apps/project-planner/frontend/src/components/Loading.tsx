import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * A simple loading component displayed as a fallback for Suspense boundaries.
 */
const Loading: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh', // Take full viewport height
        width: '100%',
        color: 'text.secondary',
      }}
      className="dark:bg-gray-900 bg-gray-50"
    >
      <CircularProgress color="primary" size={60} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Loading...
      </Typography>
    </Box>
  );
};

export default Loading;
