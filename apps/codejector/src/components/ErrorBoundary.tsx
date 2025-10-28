/**
 * FilePath: src/components/common/ErrorBoundary.tsx
 * Title: React Error Boundary Component with Custom Fallback
 * Reason: Provides a robust error boundary for React components, capturing and displaying
 *         unexpected runtime errors with an optional developer-friendly fallback in development mode.
 */

import React, { Component, ReactNode } from 'react';
import { Box, Typography, Button, useTheme, Alert } from '@mui/material';
import { Link } from 'react-router-dom';

/**
 * Props accepted by the ErrorBoundary component.
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
}

/**
 * Internal state structure for the ErrorBoundary.
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * ErrorBoundary Component
 *
 * A React class component that catches JavaScript errors anywhere in its child component tree,
 * logs them, and displays a fallback UI instead of crashing the whole application.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    };
  }

  /**
   * Lifecycle method that updates the state when an error is thrown.
   */
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  /**
   * Lifecycle method that logs the error details.
   * You can integrate remote error reporting services (e.g., Sentry, LogRocket) here.
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error: ', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    const { hasError, error, errorInfo } = this.state;

    if (hasError) {
      return this.props.fallback ? (
        this.props.fallback
      ) : (
        <DefaultFallback error={error} errorInfo={errorInfo} />
      );
    }

    return this.props.children;
  }
}

/**
 * Props for the default fallback UI.
 */
interface DefaultFallbackProps {
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * Default Fallback UI
 *
 * Provides a user-friendly interface for displaying error messages
 * and debugging details in development mode.
 */
const DefaultFallback: React.FC<DefaultFallbackProps> = ({
  error,
  errorInfo,
}) => {
  const theme = useTheme();

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
        Oops! Something went wrong.
      </Typography>
      <Typography variant="body1" paragraph>
        We’ve encountered an error and are working to fix it.
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
            {error.message}
          </Typography>
          {errorInfo && (
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              mt={1}
            >
              {errorInfo.componentStack}
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
};

export default ErrorBoundary;
