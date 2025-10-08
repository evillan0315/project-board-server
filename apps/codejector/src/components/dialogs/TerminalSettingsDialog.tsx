import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';

interface TerminalSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const TerminalSettingsDialog: React.FC<TerminalSettingsDialogProps> = ({
  open,
  onClose,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          color: 'white',
          backgroundColor: '#2d2d30',
        },
      }}
    >
      <DialogTitle>Terminal Settings</DialogTitle>

      <DialogContent dividers>
        <p>Settings will be implemented here</p>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ bgcolor: 'grey.800', '&:hover': { bgcolor: 'grey.700' } }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TerminalSettingsDialog;
