import React from 'react';
import { Snackbar as MuiSnackbar } from '@mui/material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { useStore } from '@nanostores/react';
import { snackbarStore, hideSnackbar } from '@/stores/snackbarStore';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />;
});

export const Snackbar: React.FC = () => {
  const { open, message, severity } = useStore(snackbarStore);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    hideSnackbar();
  };

  return (
    <MuiSnackbar open={open} autoHideDuration={6000} onClose={handleClose}>
      <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </MuiSnackbar>
  );
};
