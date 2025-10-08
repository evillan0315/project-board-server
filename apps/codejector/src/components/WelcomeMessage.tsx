import React from 'react';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import { APP_NAME } from '@/constants'; // Import APP_NAME

const WelcomeMessage: React.FC = () => {
  const theme = useTheme();

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        maxWidth: 400,
        mx: 'auto',
        borderRadius: 2,
        bgcolor: theme.palette.background.paper,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        color: theme.palette.text.primary,
      }}
    >
      <Box>
        <Typography
          variant="h5"
          component="div"
          sx={{ fontWeight: 'bold', mb: 1 }}
        >
          Welcome to {APP_NAME}!
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: theme.palette.text.secondary }}
        >
          Start editing your code with AI assistance.
        </Typography>
      </Box>
    </Paper>
  );
};

export default WelcomeMessage;
