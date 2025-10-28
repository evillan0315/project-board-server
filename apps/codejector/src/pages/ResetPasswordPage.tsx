import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Alert, useTheme } from '@mui/material';
import Button from '@/components/ui/Button';
import TextField from '@/components/ui/TextField';
import Loading from '@/components/Loading';
import { resetPassword } from '@/api/auth';

const ResetPasswordPage: React.FC = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Password reset token is missing from the URL.');
    }
  }, [token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!token) {
      setError('Password reset token is missing.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = await resetPassword(token, newPassword);
      setSuccess(response.message || 'Your password has been reset successfully. Redirecting to login...');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
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

  if (!token && !error) {
    return <Loading message="Checking reset token..." />;
  }

  return (
    <Box sx={containerSx} className="flex flex-col items-center justify-center min-h-screen p-4">
      <Paper sx={paperSx} className="flex flex-col gap-4 w-full max-w-md">
        <Typography variant="h5" component="h1" align="center" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
          Reset Password
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 2 }}>
          Enter your new password below.
        </Typography>

        {loading && <Loading type="linear" message="Resetting password..." />}
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        {!token && !error && (
          <Alert severity="warning">Invalid or missing password reset token. Please request a new link.</Alert>
        )}

        {token && !success && !error && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <TextField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
              helperText="Password must be at least 8 characters long."
            />
            <TextField
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !newPassword || !confirmPassword}
            >
              Reset Password
            </Button>
          </form>
        )}
      </Paper>
    </Box>
  );
};

export default ResetPasswordPage;
