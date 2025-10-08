//import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

export function GitInstructions({ instructions }: { instructions: string[] }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#1e1e1e' }}>
        <Typography
          variant="body2"
          sx={{
            fontFamily: 'monospace',
            whiteSpace: 'pre-line',
            color: 'white',
          }}
        >
          {instructions.join('\n')}
        </Typography>
      </Paper>
    </Box>
  );
}
