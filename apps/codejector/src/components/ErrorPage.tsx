/**
 * FilePath: src/pages/ErrorPage.tsx
 * Title: Application Error Page (React Router Integration)
 * Reason: Provides a user-friendly fallback interface when a route fails to load
 *         or encounters an error, including optional debug information in development mode.
 */

import { useRouteError } from 'react-router-dom';
import { Box, Typography, Button, useTheme, Alert } from '@mui/material';
import { Link } from 'react-router-dom';

/**
 * ErrorPage Component
 *
 * This component is rendered automatically by React Router when a route fails
 * (e.g., 404 Not Found, 500 Internal Server Error, etc.). It displays a generic
 * error message and, in development mode, detailed error information for debugging.
 */
export default function ErrorPage() {
  const error: any = useRouteError();
  const theme = useTheme();

  console.error('Router Error:', error);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        textAlign: 'center',
        p: 3,
      }}
    >
      <Typography variant="h4" gutterBottom>
        Oops! Page Not Found
      </Typography>

      <Typography variant="body1" paragraph>
        The requested page could not be found or an unexpected error occurred.
      </Typography>

      {process.env.NODE_ENV === 'development' && error && (
        <Alert
          severity="error"
          sx={{
            maxWidth: 600,
            textAlign: 'left',
            mt: 2,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          <Typography variant="h6" color="error" gutterBottom>
            Error Details
          </Typography>
          <Typography variant="body2" color="error.main">
            {error.statusText || error.message || 'Unknown Error'}
          </Typography>
          {error.status && (
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              Status: {error.status}
            </Typography>
          )}
        </Alert>
      )}

      <Button
        component={Link}
        to="/"
        variant="contained"
        color="primary"
        sx={{ mt: 3, borderRadius: 2 }}
      >
        Go Home
      </Button>
    </Box>
  );
}
