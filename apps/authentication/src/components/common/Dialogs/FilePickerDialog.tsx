import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { useStore } from '@nanostores/react';
import {
  fileTreeStore,
  loadInitialTree,
  projectRootDirectoryStore,
  flatFileListStore,
} from '@/stores/fileTreeStore';
import { getFileTypeIcon } from '@/constants/fileIcons';

interface FilePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (selectedPaths: string[]) => void;
  currentScanPaths: string[];
}

const FilePickerDialog: React.FC<FilePickerDialogProps> = ({
  open,
  onClose,
  onSelect,
  currentScanPaths,
}) => {
  const theme = useTheme();
  const { files, isFetchingTree, fetchTreeError, lastFetchedProjectRoot } = useStore(fileTreeStore);
  const projectRootDirectory = useStore(projectRootDirectoryStore);
  const flatFiles = useStore(flatFileListStore);

  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Load file tree on dialog open
  useEffect(() => {
    if (open && projectRootDirectory && lastFetchedProjectRoot !== projectRootDirectory) {
      loadInitialTree(projectRootDirectory);
    }
  }, [open, projectRootDirectory, lastFetchedProjectRoot]);

  // Sync selected paths on open/close
  useEffect(() => {
    if (open) setSelectedPaths(new Set(currentScanPaths));
    else {
      setSelectedPaths(new Set());
      setSearchTerm('');
    }
  }, [open, currentScanPaths]);

  const handleTogglePath = useCallback((path: string) => {
    setSelectedPaths(prev => {
      const newSet = new Set(prev);
      newSet.has(path) ? newSet.delete(path) : newSet.add(path);
      return newSet;
    });
  }, []);

  const filteredFiles = useMemo(() => {
    if (!searchTerm) return flatFiles;
    const term = searchTerm.toLowerCase();
    return flatFiles.filter(f => f.filePath.toLowerCase().includes(term));
  }, [flatFiles, searchTerm]);

  const sortedFiles = useMemo(() => {
    return [...filteredFiles].sort((a, b) => a.filePath.localeCompare(b.filePath));
  }, [filteredFiles]);

  const handleSelectAll = useCallback(() => setSelectedPaths(new Set(sortedFiles.map(f => f.filePath))), [sortedFiles]);
  const handleDeselectAll = useCallback(() => setSelectedPaths(new Set()), []);
  const handleConfirm = useCallback(() => {
    onSelect(Array.from(selectedPaths));
    onClose();
  }, [onSelect, onClose, selectedPaths]);

  const projectRootLabel = projectRootDirectory ? `Relative to: ${projectRootDirectory}` : 'No project root loaded';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: theme.palette.background.paper } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
        <Typography variant="h6" fontWeight="bold">Select Files and Folders</Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: theme.palette.text.secondary }}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{projectRootLabel}</Typography>

        <MuiTextField
          fullWidth
          size="small"
          placeholder="Search files and folders..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
            sx: {
              color: theme.palette.text.primary,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
            },
          }}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
          <Button variant="outlined" size="small" onClick={handleSelectAll} disabled={isFetchingTree || !sortedFiles.length}>Select All</Button>
          <Button variant="outlined" size="small" onClick={handleDeselectAll} disabled={isFetchingTree || !sortedFiles.length}>Deselect All</Button>
        </Box>

        {isFetchingTree ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, gap: 1 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">Loading files...</Typography>
          </Box>
        ) : fetchTreeError ? (
          <Alert severity="error">{fetchTreeError}</Alert>
        ) : sortedFiles.length === 0 ? (
          <Alert severity="info">{searchTerm ? 'No matching files found.' : 'No files available in the project root.'}</Alert>
        ) : (
          <List dense sx={{ maxHeight: 400, overflowY: 'auto', border: `1px solid ${theme.palette.divider}`, borderRadius: 1, bgcolor: theme.palette.background.default }}>
            {sortedFiles.map(f => (
              <ListItem
                key={f.filePath}
                secondaryAction={
                  <Checkbox
                    edge="end"
                    checked={selectedPaths.has(f.filePath)}
                    onChange={() => handleTogglePath(f.filePath)}
                    sx={{ color: theme.palette.primary.main }}
                  />
                }
                sx={{ '&:hover': { bgcolor: theme.palette.action.hover } }}
              >
                <ListItemIcon>{getFileTypeIcon(f.filePath, 'file')}</ListItemIcon>
                <ListItemText primary={f.filePath} primaryTypographyProps={{ color: theme.palette.text.primary }} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}`, p: 2, justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">Selected: {selectedPaths.size}</Typography>
        <Box>
          <Button onClick={onClose} sx={{ mr: 1, color: theme.palette.text.secondary }}>Cancel</Button>
          <Button onClick={handleConfirm} variant="contained" color="primary" disabled={selectedPaths.size === 0}>Add Selected</Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default FilePickerDialog;

