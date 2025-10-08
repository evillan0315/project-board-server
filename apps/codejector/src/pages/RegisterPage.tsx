import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { authStore, setError as setAuthError } from '@/stores/authStore';
import { registerLocal } from '@/services/authService';
import { APP_NAME } from '@/constants'; // Import APP_NAME

import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@/components/ui/TextField'; // Use the custom TextField
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { loading, error: authError, isLoggedIn } = useStore(authStore);
  const theme = useTheme();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    // Clear auth store error on mount if it's not a persistent error
    setAuthError(null);
    setLocalError(null);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null); // Clear previous local errors
    setAuthError(null); // Clear previous auth store errors

    if (!username || !email || !password || !confirmPassword) {
      setLocalError('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      // Assuming a minimum password length of 8 from backend DTO
      setLocalError('Password must be at least 8 characters long.');
      return;
    }

    const result = await registerLocal({ name: username, email, password }); // Pass 'name' instead of 'username' based on backend RegisterDto

    if (result.success) {
      // Registration successful, authStore should be updated and redirected by useEffect
      // No explicit navigate here, let useEffect handle it for consistency
    } else {
      // Error message is already set in authStore via registerLocal
      setLocalError(authError); // Use authError which is updated by the service
    }
  };

  if (loading) {
    return (
      <Container
        maxWidth="sm"
        className="flex justify-center items-center min-h-[50vh]"
      >
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 4,
          borderRadius: 2,
          boxShadow: 3,
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Typography
          component="h1"
          variant="h5"
          sx={{ mb: 3, fontWeight: 'bold', color: theme.palette.text.primary }}
        >
          Register for {APP_NAME}
        </Typography>

        {(localError || authError) && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {localError || authError}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleRegister}
          sx={{ mt: 1, width: '100%' }}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={
              loading || !email || !password || !confirmPassword || !username
            }
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Register'
            )}
          </Button>
          <Link
            to="/login"
            className="block text-center mt-2"
            style={{
              color: theme.palette.text.secondary,
              textDecoration: 'underline',
            }}
          >
            Already have an account? Sign in
          </Link>
        </Box>
      </Box>
    </Container>
  );
};

export default RegisterPage;
