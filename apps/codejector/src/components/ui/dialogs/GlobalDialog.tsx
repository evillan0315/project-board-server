import React, { useCallback } from 'react';
import { useStore } from '@nanostores/react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { dialogStore, hideDialog } from '@/stores/dialogStore';

/**
 * `GlobalDialog` is a central component that renders a Material-UI Dialog
 * based on the state managed by `dialogStore`. This allows any part of the
 * application to trigger a dialog without direct component coupling.
 *
 * It should be rendered once at a high level in the application tree (e.g., in `App.tsx`).
 */
const GlobalDialog: React.FC = () => {
  const theme = useTheme();
  const { open, title, content, actions, maxWidth, fullWidth, disableBackdropClick, disableEscapeKeyDown, showCloseButton, paperPropsSx } = useStore(dialogStore);

  const handleClose = useCallback(
    (_: object, reason: 'backdropClick' | 'escapeKeyDown') => {
      if (disableBackdropClick && reason === 'backdropClick') {
        return;
      }
      if (disableEscapeKeyDown && reason === 'escapeKeyDown') {
        return;
      }
      hideDialog();
    },
    [disableBackdropClick, disableEscapeKeyDown],
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          ...paperPropsSx,
        },
      }}
      aria-labelledby="global-dialog-title"
    >
      {(title || showCloseButton) && (
        <DialogTitle
          id="global-dialog-title"
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pr: 1,
            backgroundColor: theme.palette.background.default
          }}
        >
          {typeof title === 'string' ? (
            <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }} className="truncate">
              {title}
            </Typography>
          ) : (
            title
          )}
          {showCloseButton && (
            <IconButton
              onClick={hideDialog}
              size="small"
              sx={{ color: theme.palette.text.secondary }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
      )}

      {content && <DialogContent sx={{ p: 0, backgroundColor: theme.palette.background.paper }}>{content}</DialogContent>}

      {actions && (
        <DialogActions
          sx={{ pt: 1, justifyContent: 'flex-end', borderTop: `1px solid ${theme.palette.divider}` }}
        >
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default GlobalDialog;
