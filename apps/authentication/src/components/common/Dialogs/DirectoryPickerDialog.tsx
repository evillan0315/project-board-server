import React, { useEffect, useCallback, useMemo } from 'react';
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
  Tooltip,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FolderOpenIcon from '@mui/icons-material/FolderOpenOutlined';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CheckIcon from '@mui/icons-material/Check';
import * as path from 'path-browserify';
import { fileTreeStore, loadInitialTree, projectRootDirectoryStore, loadChildrenForDirectory } from '@/stores/fileTreeStore';
import { FileEntry } from '@/types/file';

// --- Flatten tree utility ---
const flattenTree = (nodes: FileEntry[]): FileEntry[] =>
  nodes.reduce<FileEntry[]>((acc, node) => {
    acc.push(node);
    if (node.type === 'folder' && node.children) acc.push(...flattenTree(node.children));
    return acc;
  }, []);

interface DirectoryPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (selectedPath: string) => void;
  initialPath?: string;
}

const DirectoryPickerDialog: React.FC<DirectoryPickerDialogProps> = ({
  open,
  onClose,
  onSelect,
  initialPath,
}) => {
  const theme = useTheme();
  const { files, isFetchingTree, fetchTreeError, lastFetchedProjectRoot } = useStore(fileTreeStore);
  const projectRootDirectory = useStore(projectRootDirectoryStore);

  const currentBrowsingPath = useMemo(() => initialPath || projectRootDirectory || '/', [initialPath, projectRootDirectory]);

  // --- Load root tree on open ---
  useEffect(() => {
    if (open && currentBrowsingPath && lastFetchedProjectRoot !== currentBrowsingPath) {
      loadInitialTree(currentBrowsingPath);
    }
  }, [open, currentBrowsingPath, lastFetchedProjectRoot]);

  // --- Directory contents for current path ---
  const currentNode = useMemo(() => {
    const findNode = (nodes: FileEntry[], targetPath: string): FileEntry | undefined => {
      for (const node of nodes) {
        if (node.path === targetPath) return node;
        if (node.children?.length) {
          const found = findNode(node.children, targetPath);
          if (found) return found;
        }
      }
    };
    return findNode(files, currentBrowsingPath);
  }, [files, currentBrowsingPath]);

  const directoryContents = useMemo(() => currentNode?.children?.filter(c => c.type === 'folder') || [], [currentNode]);

  // --- Go up one level ---
  const handleGoUp = useCallback(() => {
    const parentPath = path.dirname(currentBrowsingPath);
    if (parentPath && parentPath !== currentBrowsingPath) {
      loadChildrenForDirectory(parentPath);
      projectRootDirectoryStore.set(parentPath);
    }
  }, [currentBrowsingPath]);

  // --- Open a subdirectory ---
  const handleOpenDirectory = useCallback((dirPath: string) => {
    loadChildrenForDirectory(dirPath);
    projectRootDirectoryStore.set(dirPath);
  }, []);

  const canGoUp = useMemo(() => currentBrowsingPath.replace(/\\/g, '/') !== '/', [currentBrowsingPath]);

  const handleSelectCurrent = useCallback(() => {
    onSelect(currentBrowsingPath);
    onClose();
  }, [currentBrowsingPath, onSelect, onClose]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: theme.palette.background.paper } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
        <Typography variant="h6" fontWeight="bold">Select Project Root Folder</Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: theme.palette.text.secondary }}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <MuiTextField
            fullWidth
            size="small"
            value={currentBrowsingPath}
            InputProps={{
              startAdornment: <InputAdornment position="start"><FolderOpenIcon color="action" /></InputAdornment>,
              readOnly: true,
            }}
          />
          <Tooltip title="Go up one level">
            <span>
              <Button onClick={handleGoUp} disabled={!canGoUp || isFetchingTree}>Up</Button>
            </span>
          </Tooltip>
        </Box>

        {isFetchingTree ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography color="text.secondary">Loading folders...</Typography>
          </Box>
        ) : fetchTreeError ? (
          <Alert severity="error">{fetchTreeError}</Alert>
        ) : directoryContents.length === 0 ? (
          <Alert severity="info">No subfolders found in "{currentBrowsingPath}"</Alert>
        ) : (
          <List dense sx={{ maxHeight: 400, overflowY: 'auto', border: `1px solid ${theme.palette.divider}`, borderRadius: 1, bgcolor: theme.palette.background.default }}>
            {directoryContents.map(f => (
              <ListItem key={f.path} onClick={() => handleOpenDirectory(f.path)} sx={{ cursor: 'pointer', '&:hover': { bgcolor: theme.palette.action.hover } }}>
                <ListItemIcon><FolderIcon fontSize="small" sx={{ color: theme.palette.warning.main }} /></ListItemIcon>
                <ListItemText primary={f.name} primaryTypographyProps={{ color: theme.palette.text.primary }} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}`, p: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose} sx={{ mr: 1, color: theme.palette.text.secondary }}>Cancel</Button>
        <Button onClick={handleSelectCurrent} variant="contained" startIcon={<CheckIcon />} disabled={isFetchingTree || !!fetchTreeError}>Select This Folder</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DirectoryPickerDialog;

