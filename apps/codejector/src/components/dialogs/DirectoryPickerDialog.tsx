import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '@nanostores/react';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Typography,
  TextField as MuiTextField,
  InputAdornment,
  useTheme,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FolderOpenIcon from '@mui/icons-material/FolderOpenOutlined';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CheckIcon from '@mui/icons-material/Check';
import * as path from 'path-browserify';
import { projectRootDirectoryStore } from '@/stores/fileTreeStore';
import { fetchDirectoryContents } from '@/api/file';
import { FileTreeNode } from '@/types';

interface DirectoryPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (selectedPath: string) => void;
  initialPath?: string;
  allowExternalPaths?: boolean;
}

const DirectoryPickerDialog: React.FC<DirectoryPickerDialogProps> = ({
  open,
  onClose,
  onSelect,
  initialPath = '/media/eddie/Data/projects',
  allowExternalPaths = false,
}) => {
  const theme = useTheme();
  const [currentBrowsingPath, setCurrentBrowsingPath] =
    useState<string>(initialPath);
  const [tempPathInput, setTempPathInput] = useState<string>(initialPath);
  const [directoryContents, setDirectoryContents] = useState<FileTreeNode[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectRoot = useStore(projectRootDirectoryStore);

  useEffect(() => {
    if (open) {
      const resolvedPath = initialPath || projectRoot;
      setCurrentBrowsingPath(resolvedPath);
      setTempPathInput(resolvedPath);
      fetchContents(resolvedPath);
    } else {
      setDirectoryContents([]);
      setIsLoading(false);
      setError(null);
    }
  }, [open, initialPath, projectRoot]);

  useEffect(() => {
    setTempPathInput(currentBrowsingPath);
  }, [currentBrowsingPath]);

  const fetchContents = useCallback(async (dirPath: string) => {
    setIsLoading(true);
    setError(null);
    setDirectoryContents([]);
    try {
      const contents = await fetchDirectoryContents(dirPath);
      const foldersOnly = contents.filter((item) => item.type === 'folder');
      foldersOnly.sort((a, b) => a.name.localeCompare(b.name));
      setDirectoryContents(foldersOnly);
    } catch (err) {
      console.error(`Error fetching directory contents for ${dirPath}:`, err);
      setError(
        `Failed to load directory contents: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGoUp = useCallback(() => {
    const parentPath = path.dirname(currentBrowsingPath);
    const canGoAboveRoot =
      allowExternalPaths || parentPath.startsWith(projectRoot);
    if (parentPath && parentPath !== currentBrowsingPath && canGoAboveRoot) {
      setCurrentBrowsingPath(parentPath);
      fetchContents(parentPath);
    }
  }, [currentBrowsingPath, fetchContents, allowExternalPaths, projectRoot]);

  const handleOpenDirectory = useCallback(
    (dirPath: string) => {
      setCurrentBrowsingPath(dirPath);
      projectRootDirectoryStore.set(dirPath);
      fetchContents(dirPath);
    },
    [fetchContents],
  );

  const handleSelectCurrent = useCallback(() => {
    onSelect(currentBrowsingPath);
    projectRootDirectoryStore.set(currentBrowsingPath);
    fetchContents(currentBrowsingPath);
    onClose();
  }, [currentBrowsingPath, onSelect, onClose]);

  const handleTempPathInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setTempPathInput(e.target.value);
  };

  const handleGoToPath = useCallback(() => {
    const trimmedPath = tempPathInput.trim();
    if (trimmedPath) {
      setCurrentBrowsingPath(trimmedPath);
      fetchContents(trimmedPath);
    }
  }, [tempPathInput, fetchContents]);

  const canGoUp = useMemo(() => {
    const normalizedPath = currentBrowsingPath.replace(/\\/g, '/');
    const rootPatterns = ['/', /^[a-zA-Z]:\/$/];
    if (allowExternalPaths) return true;
    return (
      !rootPatterns.some((pattern) =>
        typeof pattern === 'string'
          ? normalizedPath === pattern
          : pattern.test(normalizedPath),
      ) && normalizedPath.startsWith(projectRoot)
    );
  }, [currentBrowsingPath, allowExternalPaths, projectRoot]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pr: 1,
        }}
      >
        <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
          Select Project Root Folder
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: theme.palette.text.secondary }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{ p: 2, backgroundColor: theme.palette.background.paper }}
      >
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 2 }}
        >
          <MuiTextField
            fullWidth
            variant="outlined"
            placeholder="Enter path or browse..."
            value={tempPathInput}
            onChange={handleTempPathInputChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FolderOpenIcon color="action" />
                </InputAdornment>
              ),
              sx: {
                color: theme.palette.text.primary,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.divider,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
            size="small"
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleGoToPath();
            }}
          />
          <Tooltip title="Go to path">
            <Button
              variant="contained"
              onClick={handleGoToPath}
              disabled={!tempPathInput.trim()}
              size="small"
              sx={{ whiteSpace: 'nowrap' }}
            >
              Go
            </Button>
          </Tooltip>
          <Tooltip title="Go up one level">
            <span>
              <IconButton
                onClick={handleGoUp}
                disabled={!canGoUp || isLoading}
                size="small"
                sx={{ color: theme.palette.text.secondary }}
              >
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Current:{' '}
          <Typography component="span" fontWeight="bold">
            {currentBrowsingPath}
          </Typography>
        </Typography>

        {isLoading ? (
          <Box className="flex justify-center items-center h-48">
            <CircularProgress size={24} />
            <Typography
              variant="body2"
              sx={{ ml: 2, color: theme.palette.text.secondary }}
            >
              Loading folders...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : directoryContents.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No subfolders found in "{currentBrowsingPath}".
          </Alert>
        ) : (
          <List
            dense
            sx={{
              maxHeight: '400px',
              overflowY: 'auto',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              bgcolor: theme.palette.background.default,
            }}
          >
            {directoryContents.map((folder) => (
              <ListItem
                key={folder.path}
                onClick={() => handleOpenDirectory(folder.path)}
                sx={{
                  '&:hover': { bgcolor: theme.palette.action.hover },
                  cursor: 'pointer',
                }}
              >
                <ListItemIcon>
                  <FolderIcon
                    fontSize="small"
                    sx={{ color: theme.palette.warning.main }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={folder.name}
                  primaryTypographyProps={{
                    style: { color: theme.palette.text.primary },
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions
        className="flex items-center justify-between gap-2"
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box className="truncate" sx={{ color: theme.palette.text.secondary }}>
          <Typography fontWeight="bold">{currentBrowsingPath}</Typography>
        </Box>
        <Box className="flex items-center gap-2">
          <Button
            onClick={onClose}
            sx={{ mr: 1, color: theme.palette.text.secondary }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSelectCurrent}
            variant="contained"
            color="primary"
            startIcon={<CheckIcon />}
            disabled={isLoading || error !== null}
          >
            Select
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default DirectoryPickerDialog;
