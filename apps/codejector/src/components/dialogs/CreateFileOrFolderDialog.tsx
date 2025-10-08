import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  IconButton,
  useTheme,
  Box,
  CircularProgress,
  Alert,
  InputAdornment, // Added InputAdornment import
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CodeMirror from '@uiw/react-codemirror';
import { useStore } from '@nanostores/react';
import { themeStore } from '@/stores/themeStore';
import { createFileOrFolder as apiCreateFileOrFolder } from '@/api/file';
import { getCodeMirrorLanguage, createCodeMirrorTheme } from '@/utils/index';
import * as path from 'path-browserify';

interface CreateFileOrFolderDialogProps {
  open: boolean;
  onClose: () => void;
  parentPath: string;
  isFolder: boolean;
  onCreateSuccess: (newPath: string) => void;
}

const CreateFileOrFolderDialog: React.FC<CreateFileOrFolderDialogProps> = ({
  open,
  onClose,
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
    if (open) {
      setName('');
      setContent('');
      setError(null);
      setLoading(false);
    }
  }, [open]);

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
        onClose();
      } else {
        setError(
          result.filePath ||
            `Failed to create ${isFolder ? 'folder' : 'file'}.`,
        );
      }
    } catch (err: any) {
      setError(`Failed to create: ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const languageExtensions = useMemo(() => {
    if (isFolder) return [];
    return [getCodeMirrorLanguage(name || '.txt')]; // Dynamically detect language based on name
  }, [name, isFolder]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: muiTheme.palette.background.paper,
          color: muiTheme.palette.text.primary,
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: `1px solid ${muiTheme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pr: 1,
        }}
      >
        <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
          {isFolder ? 'Create New Folder' : 'Create New File'}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: muiTheme.palette.text.secondary }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2 }}>
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
      </DialogContent>
      <DialogActions
        sx={{
          borderTop: `1px solid ${muiTheme.palette.divider}`,
          p: 2,
          justifyContent: 'flex-end',
        }}
      >
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={loading || !name.trim()}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {isFolder ? 'Create Folder' : 'Create File'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateFileOrFolderDialog;
