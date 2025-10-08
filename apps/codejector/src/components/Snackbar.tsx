import React from 'react';
import MuiSnackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { useTheme } from '@mui/material';

interface CustomSnackbarProps {
  open: boolean;
  message: string;
  severity: AlertProps['severity']; // Severity can be undefined
  onClose: () => void;
  autoHideDuration?: number;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  },
);

const Snackbar: React.FC<CustomSnackbarProps> = ({
  open,
  message,
  severity, // Severity is now AlertProps['severity']
  onClose,
  autoHideDuration = 3000,
}) => {
  const theme = useTheme();

  return (
    <MuiSnackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      // Pass the Alert component as children, or undefined if severity is not set
      children={
        severity ? (
          <Alert
            onClose={onClose}
            severity={severity}
            sx={{
              width: '100%',
              bgcolor: theme.palette[severity]?.main || theme.palette.grey[800],
              color: theme.palette.getContrastText(
                theme.palette[severity]?.main || theme.palette.grey[800],
              ),
            }}
          >
            {message}
          </Alert>
        ) : undefined // Pass undefined instead of null
      }
    />
  );
};

export default Snackbar;
