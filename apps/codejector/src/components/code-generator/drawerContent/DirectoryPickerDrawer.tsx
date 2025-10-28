import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '@nanostores/react';

import {
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
  Button,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOutlined';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CheckIcon from '@mui/icons-material/Check';
import * as path from 'path-browserify';
import { projectRootDirectoryStore } from '@/stores/fileTreeStore';
import { fetchDirectoryContents } from '@/api/file';
import { FileTreeNode } from '@/types';

interface DirectoryPickerDrawerProps {
  onSelect: (selectedPath: string) => void;
  onClose: () => void;
  initialPath?: string;
  allowExternalPaths?: boolean;
  onPathUpdate?: (path: string) => void; // New prop for external path updates
}

const DirectoryPickerDrawer: React.FC<DirectoryPickerDrawerProps> = ({
  onSelect,
  onClose,
  initialPath = '/media/eddie/Data/projects',
  allowExternalPaths = false,
  onPathUpdate, // Destructure new prop
}) => {
  const theme = useTheme();
  const [currentBrowsingPath, setCurrentBrowsingPath] = useState<string>('');
  const [tempPathInput, setTempPathInput] = useState<string>('');
  const [directoryContents, setDirectoryContents] = useState<FileTreeNode[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectRoot = useStore(projectRootDirectoryStore);

  useEffect(() => {
    // Initialize with effective initial path
    const effectiveInitialPath = initialPath || projectRoot || '/';
    setCurrentBrowsingPath(effectiveInitialPath);
    setTempPathInput(effectiveInitialPath);
    // Only fetch contents if the drawer is logically 'open' or relevant for initial load
    fetchContents(effectiveInitialPath);
    if (onPathUpdate) {
      onPathUpdate(effectiveInitialPath);
    }
  }, [initialPath, projectRoot]); // Dependencies for initial setup

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
      setCurrentBrowsingPath(dirPath); // Update current path after successful fetch
      if (onPathUpdate) {
        onPathUpdate(dirPath);
      }
    } catch (err) {
      console.error(`Error fetching directory contents for ${dirPath}:`, err);
      setError(
        `Failed to load directory contents: ${err instanceof Error ? err.message : String(err)}`,
      );
      if (onPathUpdate) {
        // Notify parent of path, even if loading failed (e.g., for error context)
        onPathUpdate(dirPath);
      }
    } finally {
      setIsLoading(false);
    }
  }, [onPathUpdate]);

  const handleGoUp = useCallback(() => {
    const parentPath = path.dirname(currentBrowsingPath);
    const normalizedCurrentPath = currentBrowsingPath.replace(/\\/g, '/');
    const normalizedParentPath = parentPath.replace(/\\/g, '/');

    const canGoAboveRoot = allowExternalPaths || normalizedParentPath.startsWith(projectRoot.replace(/\\/g, '/'));

    if (
      normalizedParentPath &&
      normalizedParentPath !== normalizedCurrentPath &&
      canGoAboveRoot
    ) {
      setCurrentBrowsingPath(normalizedParentPath);
      if (onPathUpdate) {
        onPathUpdate(normalizedParentPath);
      }
      fetchContents(normalizedParentPath);
    }
  }, [currentBrowsingPath, fetchContents, allowExternalPaths, projectRoot, onPathUpdate]);

  const handleOpenDirectory = useCallback(
    (dirPath: string) => {
      setCurrentBrowsingPath(dirPath);
      if (onPathUpdate) {
        onPathUpdate(dirPath);
      }
      // No need to set projectRootDirectoryStore here, it's done upon 'Select' by parent
      fetchContents(dirPath);
    },
    [fetchContents, onPathUpdate],
  );

  // Removed handleSelectCurrent as selection is handled by parent's footer action
  // const handleSelectCurrent = useCallback(() => {
  //   onSelect(currentBrowsingPath);
  //   // The parent (BottomToolbar) will handle projectRootDirectoryStore.set(currentBrowsingPath)
  //   onClose(); // Close the drawer after selection
  // }, [currentBrowsingPath, onSelect, onClose]);

  const handleTempPathInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newPath = e.target.value;
    setTempPathInput(newPath);
    if (onPathUpdate) {
      onPathUpdate(newPath); // Notify parent of manual input change
    }
  };

  const handleGoToPath = useCallback(() => {
    const trimmedPath = tempPathInput.trim();
    if (trimmedPath) {
      setCurrentBrowsingPath(trimmedPath);
      if (onPathUpdate) {
        onPathUpdate(trimmedPath);
      }
      fetchContents(trimmedPath);
    }
  }, [tempPathInput, fetchContents, onPathUpdate]);

  const canGoUp = useMemo(() => {
    const normalizedPath = currentBrowsingPath.replace(/\\/g, '/');
    const normalizedProjectRoot = projectRoot.replace(/\\/g, '/');
    const rootPatterns = ['/', /^[a-zA-Z]:\/$/];
    if (allowExternalPaths) return true;
    return (
      !rootPatterns.some((pattern) =>
        typeof pattern === 'string'
          ? normalizedPath === pattern
          : pattern.test(normalizedPath),
      ) && normalizedPath.startsWith(normalizedProjectRoot)
    );
  }, [currentBrowsingPath, allowExternalPaths, projectRoot]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        p: 2,
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
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
            maxHeight: '100%',
            overflowY: 'auto',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            bgcolor: theme.palette.background.default,
            flexGrow: 1,
          }}
        >
          {directoryContents.map((folder) => (
            <ListItem
              key={folder.path}
              onClick={() => handleOpenDirectory(folder.path)}
              sx={
                {
                  '&:hover': { bgcolor: theme.palette.action.hover },
                  cursor: 'pointer',
                }
              }
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
    </Box>
  );
};

export default DirectoryPickerDrawer;
