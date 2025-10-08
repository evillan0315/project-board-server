import React from 'react';
import { Box, Typography, Container, Paper, useTheme } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';

const DashboardPage: React.FC = () => {
  const theme = useTheme();

  return (
    <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <DashboardIcon
          sx={{ fontSize: 60, color: theme.palette.primary.main }}
        />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center">
          Welcome to your personal dashboard! This is where you can see an
          overview of your projects, recent activities, and key metrics. This
          page is currently under development.
        </Typography>
        <Box sx={{ mt: 3, width: '100%' }}>
          {/* Placeholder for dashboard content */}
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              bgcolor: theme.palette.background.default,
              color: theme.palette.text.primary,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No recent activity to display.
            </Typography>
          </Paper>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              bgcolor: theme.palette.background.default,
              color: theme.palette.text.primary,
              mt: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Project Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No projects linked yet.
            </Typography>
          </Paper>
        </Box>
      </Paper>
    </Container>
  );
};

export default DashboardPage;
