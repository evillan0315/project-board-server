import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography, CircularProgress } from '@mui/material';
import { copyFile as apiCopyFile, moveFile as apiMoveFile } from '@/api/file';
import { FileEntry } from '@/types/refactored/fileTree';
import * as path from 'path-browserify';

interface OperationPathDialogProps {
  open: boolean;
  onClose: () => void;
  item: FileEntry | null; // The file or folder to copy/move
  mode: 'copy' | 'move';
  onOperationSuccess: (sourcePath: string, destinationPath: string) => void;
  snackbar: { show: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void };
  projectRoot: string; // Current project root for path validation/suggestion
  projectId: string | undefined; // Add projectId
}

export const OperationPathDialog: React.FC<OperationPathDialogProps> = ({ open, onClose, item, mode, onOperationSuccess, snackbar, projectRoot, projectId }) => {
  const [destinationPathInput, setDestinationPathInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const operationLabel = mode === 'copy' ? 'Copy' : 'Move';

  useEffect(() => {
    if (open && item) {
      // Suggest a default destination path, e.g., parent directory or project root
      const parentDir = path.dirname(item.path);
      setDestinationPathInput(parentDir === projectRoot ? projectRoot : parentDir);
      setError('');
      setLoading(false);
    }
  }, [open, item, projectRoot]);

  const handleOperation = async () => {
    if (!item) return;
    if (!destinationPathInput.trim()) {
      setError('Destination path cannot be empty.');
      return;
    }
    if (!projectId) {
      snackbar.show('No project selected. Cannot perform file operation.', 'error');
      return;
    }

    // Construct the full destination path including the item's name
    const finalDestinationPath = path.join(destinationPathInput, item.name);

    if (finalDestinationPath === item.path) {
      setError('Source and destination paths are the same.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      let result;
      if (mode === 'copy') {
        result = await apiCopyFile(item.path, finalDestinationPath, projectId); // Pass projectId
      } else {
        result = await apiMoveFile(item.path, finalDestinationPath, projectId); // Pass projectId
      }

      if (result.success) {
        onOperationSuccess(item.path, finalDestinationPath);
        snackbar.show(result.message || `${operationLabel}ed successfully!`, 'success');
        onClose();
      } else {
        setError(result.message || `Failed to ${mode} item.`);
        snackbar.show(result.message || `Failed to ${mode} item.`, 'error');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      snackbar.show(`Error ${mode}ing: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{operationLabel} {item?.type === 'folder' ? 'Folder' : 'File'}: {item?.name}</DialogTitle>
      <DialogContent>
        {item && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Source Path: {item.path}
          </Typography>
        )}
        <TextField
          autoFocus
          margin="dense"
          label={`Destination Directory`}
          type="text"
          fullWidth
          value={destinationPathInput}
          onChange={(e) => setDestinationPathInput(e.target.value)}
          error={!!error}
          helperText={error || 'Enter the target directory for the operation.'}
          sx={{ mb: 2 }}
        />
        <Typography variant="caption" color="text.secondary">
          Final {operationLabel} Path: {path.join(destinationPathInput, item?.name || '')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleOperation} disabled={loading} variant="contained" color="primary">
          {loading ? <CircularProgress size={24} /> : operationLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default OperationPathDialog;
