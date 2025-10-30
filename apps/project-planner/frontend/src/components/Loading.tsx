import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingProps {
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Loading...' }) => {
  return (
    <Box className='flex flex-col items-center justify-center p-4'>
      <CircularProgress color='primary' size={40} />
      <Typography variant='body1' sx={{ mt: 2 }}>
        {message}
      </Typography>
    </Box>
  );
};
