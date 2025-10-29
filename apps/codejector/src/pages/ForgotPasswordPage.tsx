import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Alert, useTheme } from '@mui/material';
import Button from '@/components/ui/Button';
import TextField from '@/components/ui/TextField';
import Loading from '@/components/Loading';
import { requestPasswordReset } from '@/api/auth';
import { APP_NAME } from '@/constants';

const ForgotPasswordPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!email) {
      setError('Email address is required.');
      setLoading(false);
      return;
    }

    try {
      const response = await requestPasswordReset(email);
      setSuccess(
        response.message ||
          'If an account with that email exists, a password reset link has been sent.',
      );
      setEmail('');
    } catch (err: any) {
      // Backend typically returns a generic success message even if email not found for security reasons.
      // So, if an error is caught here, it's likely a network error or an unexpected server issue.
      setSuccess(
        'If an account with that email exists, a password reset link has been sent.',
      );
      // Optionally, log the actual error for debugging, but don't show it to the user.
      console.error('Forgot password API error:', err);
    } finally {
      setLoading(false);
    }
  };

  const containerSx = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    bgcolor: theme.palette.background.default,
    padding: 2,
  };

  const paperSx = {
    padding: 4,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    width: '100%',
    maxWidth: 400,
    bgcolor: theme.palette.background.paper,
    boxShadow: theme.shadows[3],
    borderRadius: theme.shape.borderRadius,
  };

  return (
    <Box
      sx={containerSx}
      className="flex flex-col items-center justify-center min-h-screen p-4"
    >
      <Paper sx={paperSx} className="flex flex-col gap-4 w-full max-w-md">
        <Typography
          variant="h5"
          component="h1"
          align="center"
          gutterBottom
          sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}
        >
          Forgot Password
        </Typography>
        <Typography
          variant="body2"
          align="center"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          Enter your email address and we'll send you a link to reset your
          password.
        </Typography>

        {loading && <Loading type="linear" message="Sending reset link..." />}
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        {!success && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <TextField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !email}
            >
              Send Reset Link
            </Button>
          </form>
        )}

        <Link
          to="/login"
          className="block text-center mt-2"
          style={{
            color: theme.palette.text.secondary,
            textDecoration: 'underline',
          }}
        >
          Back to Sign In
        </Link>
      </Paper>
    </Box>
  );
};

export default ForgotPasswordPage;
