//import React from 'react';
import { Box, Typography } from '@mui/material';

export function ThoughtProcess({ text }: { text: string }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
        {text}
      </Typography>
    </Box>
  );
}
