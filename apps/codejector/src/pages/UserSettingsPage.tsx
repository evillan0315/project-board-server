import React from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  useTheme,
  Button,
  Divider,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { Link } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const UserSettingsPage: React.FC = () => {
  const theme = useTheme();

  return (
    <Container maxWidth="md" sx={{ py: 4, flexGrow: 1 }}>
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
          minHeight: 'calc(100vh - 120px)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            mb: 2,
          }}
        >
          <Button
            startIcon={<ArrowBackIcon />}
            component={Link}
            to="/profile"
            variant="outlined"
            sx={{ mr: 'auto' }}
          >
            Back to Profile
          </Button>
        </Box>

        <SettingsIcon
          sx={{ fontSize: 60, color: theme.palette.primary.main }}
        />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          User Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center">
          Manage your account preferences, notifications, and other settings
          here. This page is currently under development.
        </Typography>

        <Divider sx={{ width: '100%', my: 3 }} />

        <Box sx={{ mt: 3, width: '100%', maxWidth: 500 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              bgcolor: theme.palette.background.default,
              color: theme.palette.text.primary,
              mb: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update your email, password, or display name.
            </Typography>
            <Button variant="text" color="primary" sx={{ mt: 2 }} disabled>
              Manage Account (Coming Soon)
            </Button>
          </Paper>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              bgcolor: theme.palette.background.default,
              color: theme.palette.text.primary,
              mb: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Notification Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure how you receive alerts and updates.
            </Typography>
            <Button variant="text" color="primary" sx={{ mt: 2 }} disabled>
              Manage Notifications (Coming Soon)
            </Button>
          </Paper>
        </Box>
      </Paper>
    </Container>
  );
};

export default UserSettingsPage;
