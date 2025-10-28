import React, { useState, useEffect } from 'react';
import {
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  InputAdornment,
  Box,
  useTheme,
} from '@mui/material';
import { renameFile as apiRenameFile } from '@/api/file';
import { FileEntry } from '@/types/refactored/fileTree';
import * as path from 'path-browserify';
import { showDialog, hideDialog } from '@/stores/dialogStore';
import { showGlobalSnackbar } from '@/stores/snackbarStore';
import { projectStore } from '@/stores/projectStore';
import { useStore } from '@nanostores/react';
import GlobalActionButton, { GlobalAction } from '@/components/ui/GlobalActionButton';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { MdiRenameBox } from '@/components/icons/MdiRenameBox';

// -----------------------------------------------------------------------------
// Component for the content of the Rename Dialog
// -----------------------------------------------------------------------------
interface RenameContentProps {
  item: FileEntry | null; // The file or folder to rename
  onRenameSuccess: (oldPath: string, newPath: string) => void;
}

const RenameContent: React.FC<RenameContentProps> = ({ item, onRenameSuccess }) => {
  const muiTheme = useTheme();
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const projectId = useStore(projectStore).currentProject?.id; // Get projectId from store

  useEffect(() => {
    if (item) {
      setNewName(item.name);
      setError('');
      setLoading(false);
    }
  }, [item]);

  const handleRename = async () => {
    if (!item) return;
    if (!newName.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    if (newName.trim() === item.name) {
      hideDialog(); // No change, just close
      return;
    }
    if (!projectId) {
      showGlobalSnackbar('No project selected. Cannot rename file/folder.', 'error');
      setError('No project selected. Cannot rename file/folder.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const parentDir = path.dirname(item.path);
      const newPath = path.join(parentDir, newName.trim());
      const result = await apiRenameFile(item.path, newPath, projectId);
      if (result.success) {
        onRenameSuccess(item.path, newPath);
        showGlobalSnackbar(result.message || 'Item renamed successfully!', 'success');
        hideDialog();
      } else {
        const errorMessage = result.message || 'Failed to rename item.';
        setError(errorMessage);
        showGlobalSnackbar(errorMessage, 'error');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred.';
      setError(errorMessage);
      showGlobalSnackbar(`Error renaming: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const dialogActions: GlobalAction[] = [
    {
      label: 'Cancel',
      action: hideDialog,
      disabled: loading,
      color: 'text',
      variant: 'outlined',
      icon: <CloseIcon />
    },
    {
      label: 'Rename',
      action: handleRename,
      disabled: loading || !newName.trim(),
      color: 'primary',
      variant: 'contained',
      icon: loading ? <CircularProgress size={20} /> : <EditIcon />,
    },
  ];

  return (
    <>
      <Box className="p-4">
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {item && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Current Path: <strong>{item.path}</strong>
          </Typography>
        )}
        <TextField
          autoFocus
          margin="dense"
          label="New Name"
          type="text"
          fullWidth
          variant="outlined"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          disabled={loading}
          error={!!error}
          helperText={error || `Enter the new name for the ${item?.type || 'item'}`}
          sx={{ mt: 2 }}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            style: { color: muiTheme.palette.text.primary },
            startAdornment: (
              <InputAdornment position="start">
                <MdiRenameBox sx={{ color: muiTheme.palette.info.main }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <DialogActions sx={{ pt: 1, mt: 1, justifyContent: 'flex-end', borderTop: `1px solid ${muiTheme.palette.divider}` }}>
        <GlobalActionButton globalActions={dialogActions} iconOnly={false} />
      </DialogActions>
    </>
  );
};

// -----------------------------------------------------------------------------
// Function to show the Rename Dialog via GlobalDialog
// -----------------------------------------------------------------------------
interface ShowRenameDialogProps {
  item: FileEntry | null;
  onRenameSuccess: (oldPath: string, newPath: string) => void;
}

export const showRenameDialog = ({
  item,
  onRenameSuccess,
}: ShowRenameDialogProps) => {
  if (!item) {
    showGlobalSnackbar('No item selected for rename.', 'warning');
    return;
  }
  showDialog({
    title: `Rename ${item.type === 'folder' ? 'Folder' : 'File'}: ${item.name}`,
    content: (
      <RenameContent
        item={item}
        onRenameSuccess={onRenameSuccess}
      />
    ),
    maxWidth: 'sm',
    fullWidth: true,
    showCloseButton: true,
    onClose: hideDialog,
  });
};
