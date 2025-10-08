import React from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  useTheme,
  Avatar,
  Button,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import { Link, useNavigate } from 'react-router-dom';
import Loading from '@/components/Loading';

const UserProfilePage: React.FC = () => {
  const theme = useTheme();
  const { user, loading: authLoading, isLoggedIn } = useStore(authStore);
  const navigate = useNavigate();

  if (authLoading) {
    return <Loading message="Loading user profile..." />;
  }

  if (!isLoggedIn || !user) {
    navigate('/login');
    return null;
  }

  const displayName = user.name || user.username || 'N/A';
  const displayEmail = user.email || 'N/A';
  const displayRole = user.role || 'User';
  const displayOrganization = user.organization || 'N/A';

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
        <Avatar
          alt={displayName}
          src={user.image || undefined}
          sx={{
            width: 120,
            height: 120,
            mb: 2,
            bgcolor: theme.palette.primary.main,
            fontSize: 50,
            color: theme.palette.primary.contrastText,
          }}
        >
          {!user.image && displayName[0] ? displayName[0].toUpperCase() : null}
        </Avatar>

        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          {displayName}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {user.role} at {displayOrganization}
        </Typography>

        <Box sx={{ width: '100%', maxWidth: 400, mt: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1.5,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              Email:
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {displayEmail}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1.5,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              Role:
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {displayRole}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1.5,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              Provider:
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user.provider || 'Local'}
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<SettingsIcon />}
          component={Link}
          to="/settings"
          sx={{ mt: 3, py: 1.5, px: 3, fontSize: '1.05rem' }}
        >
          Edit Profile Settings
        </Button>
      </Paper>
    </Container>
  );
};

export default UserProfilePage;
