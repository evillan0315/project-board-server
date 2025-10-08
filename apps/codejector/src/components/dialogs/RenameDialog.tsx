import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography, CircularProgress } from '@mui/material';
import { renameFile as apiRenameFile } from '@/api/file';
import { FileEntry } from '@/types/refactored/fileTree';
import * as path from 'path-browserify';

interface RenameDialogProps {
  open: boolean;
  onClose: () => void;
  item: FileEntry | null; // The file or folder to rename
  onRenameSuccess: (oldPath: string, newPath: string) => void;
  snackbar: { show: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void };
  projectId: string | undefined; // Add projectId
}

export const RenameDialog: React.FC<RenameDialogProps> = ({ open, onClose, item, onRenameSuccess, snackbar, projectId }) => {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && item) {
      setNewName(item.name);
      setError('');
      setLoading(false);
    }
  }, [open, item]);

  const handleRename = async () => {
    if (!item) return;
    if (!newName.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    if (newName.trim() === item.name) {
      onClose(); // No change, just close
      return;
    }
    if (!projectId) {
      snackbar.show('No project selected. Cannot rename file/folder.', 'error');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const parentDir = path.dirname(item.path);
      const newPath = path.join(parentDir, newName);
      const result = await apiRenameFile(item.path, newPath, projectId); // Pass projectId
      if (result.success) {
        onRenameSuccess(item.path, newPath);
        snackbar.show(result.message || 'Item renamed successfully!', 'success');
        onClose();
      } else {
        setError(result.message || 'Failed to rename item.');
        snackbar.show(result.message || 'Failed to rename item.', 'error');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      snackbar.show(`Error renaming: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Rename {item?.type === 'folder' ? 'Folder' : 'File'}</DialogTitle>
      <DialogContent>
        {item && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Current Path: {item.path}
          </Typography>
        )}
        <TextField
          autoFocus
          margin="dense"
          label="New Name"
          type="text"
          fullWidth
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          error={!!error}
          helperText={error}
          sx={{ mb: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleRename} disabled={loading} variant="contained" color="primary">
          {loading ? <CircularProgress size={24} /> : 'Rename'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenameDialog;
