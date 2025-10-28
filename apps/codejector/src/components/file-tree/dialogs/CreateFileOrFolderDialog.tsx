import React, { useState, useEffect, useMemo } from 'react';
import {
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  InputAdornment,
  Box,
  useTheme,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Close';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CodeMirror from '@uiw/react-codemirror';
import { useStore } from '@nanostores/react';
import { themeStore } from '@/stores/themeStore';
import { createFileOrFolder as apiCreateFileOrFolder } from '@/api/file';
import { getCodeMirrorLanguage, createCodeMirrorTheme } from '@/utils/index';
import * as path from 'path-browserify';
import { showDialog, hideDialog } from '@/stores/dialogStore';
import { showGlobalSnackbar } from '@/stores/snackbarStore';
import GlobalActionButton, { GlobalAction } from '@/components/ui/GlobalActionButton';

// -----------------------------------------------------------------------------
// Component for the content of the Create File/Folder dialog
// -----------------------------------------------------------------------------
interface CreateFileOrFolderContentProps {
  parentPath: string;
  isFolder: boolean;
  onCreateSuccess: (newPath: string) => void;
}

const CreateFileOrFolderContent: React.FC<CreateFileOrFolderContentProps> = ({
  parentPath,
  isFolder,
  onCreateSuccess,
}) => {
  const muiTheme = useTheme();
  const { mode } = useStore(themeStore);
  const [name, setName] = useState('');
  const [content, setContent] = useState(''); // Only for files
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName('');
    setContent('');
    setError(null);
    setLoading(false);
  }, [parentPath, isFolder]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(
        isFolder
          ? 'Folder name cannot be empty.'
          : 'File name cannot be empty.',
      );
      return;
    }

    setLoading(true);
    setError(null);

    const fullPath = path.join(parentPath, name.trim());
    const initialContent = isFolder ? undefined : content;

    try {
      const result = await apiCreateFileOrFolder(
        fullPath,
        isFolder,
        initialContent,
      );
      if (result.success) {
        onCreateSuccess(fullPath);
        showGlobalSnackbar(
          `${isFolder ? 'Folder' : 'File'} created successfully at ${fullPath}`,
          'success',
        );
        hideDialog();
      } else {
        const errorMessage =
          result.filePath ||
          `Failed to create ${isFolder ? 'folder' : 'file'}.`;
        setError(errorMessage);
        showGlobalSnackbar(errorMessage, 'error');
      }
    } catch (err: any) {
      const errorMessage = `Failed to create: ${err.message || String(err)}`;
      setError(errorMessage);
      showGlobalSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const languageExtensions = useMemo(() => {
    if (isFolder) return [];
    return [getCodeMirrorLanguage(name || '.txt')];
  }, [name, isFolder]);

  const dialogActions: GlobalAction[] = [
    {
      label: 'Cancel',
      action: hideDialog,
      disabled: loading,
      color: 'text',
      variant: 'outlined',
      icon: <CancelIcon />
    },
    {
      label: isFolder ? 'Create Folder' : 'Create File',
      action: handleSubmit,
      color: 'primary',
      variant: 'contained',
      disabled: loading || !name.trim(),
      icon: loading ? <CircularProgress size={20} /> : (isFolder ? <FolderIcon  /> : <InsertDriveFileIcon />),
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
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Parent Directory: <strong>{parentPath}</strong>
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label={isFolder ? 'Folder Name' : 'File Name'}
          type="text"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          sx={{ mt: 2 }}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            style: { color: muiTheme.palette.text.primary },
            startAdornment: (
              <InputAdornment position="start">
                {isFolder ? (
                  <FolderIcon sx={{ color: muiTheme.palette.warning.main }} />
                ) : (
                  <InsertDriveFileIcon
                    sx={{ color: muiTheme.palette.info.main }}
                  />
                )}
              </InputAdornment>
            ),
          }}
        />

        {!isFolder && (
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ color: muiTheme.palette.text.primary }}
            >
              Initial Content (Optional):
            </Typography>
            <CodeMirror
              value={content}
              onChange={setContent}
              extensions={[
                ...languageExtensions,
                createCodeMirrorTheme(muiTheme),
              ]}
              theme={mode}
              editable={!loading}
              minHeight="150px"
              maxHeight="300px"
              style={{
                borderRadius: muiTheme.shape.borderRadius + 'px',
                border: `1px solid ${muiTheme.palette.divider}`,
                overflow: 'hidden',
              }}
            />
          </Box>
        )}
      </Box>
      <DialogActions sx={{ pt: 1,  mt:1, justifyContent: 'flex-end', borderTop: `1px solid ${muiTheme.palette.divider}` }}>
        <GlobalActionButton globalActions={dialogActions} iconOnly={false} />
      </DialogActions>
    </>
  );
};

// -----------------------------------------------------------------------------
// Function to show the Create File/Folder Dialog via GlobalDialog
// -----------------------------------------------------------------------------
interface ShowCreateFileOrFolderDialogProps {
  parentPath: string;
  isFolder: boolean;
  onCreateSuccess: (newPath: string) => void;
}

export const showCreateFileOrFolderDialog = ({
  parentPath,
  isFolder,
  onCreateSuccess,
}: ShowCreateFileOrFolderDialogProps) => {
  showDialog({
    title: isFolder ? 'Create New Folder' : 'Create New File',
    content: (
      <CreateFileOrFolderContent
        parentPath={parentPath}
        isFolder={isFolder}
        onCreateSuccess={onCreateSuccess}
      />
    ),
    maxWidth: 'sm',
    fullWidth: true,
    showCloseButton: true,
    onClose: hideDialog,
  });
};
