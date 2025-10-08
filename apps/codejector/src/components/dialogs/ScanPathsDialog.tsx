import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Typography,
  Chip,
  InputAdornment,
  useTheme,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { truncateFilePath } from '@/utils/fileUtils';

interface ScanPathsDialogProps {
  open: boolean;
  onClose: () => void;
  currentScanPaths: string[];
  availablePaths?: string[];
  allowExternalPaths?: boolean;
  onUpdatePaths?: (paths: string[]) => void;
}

const ScanPathsDialog: React.FC<ScanPathsDialogProps> = ({
  open,
  onClose,
  currentScanPaths,
  availablePaths = [],
  allowExternalPaths = false,
  onUpdatePaths,
}) => {
  const theme = useTheme();
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [manualPathInput, setManualPathInput] = useState('');

  // Sync dialog state with props
  useEffect(() => {
    if (open) {
      setSelectedPaths(currentScanPaths);
      setSearchTerm('');
      setManualPathInput('');
    }
  }, [open, currentScanPaths]);

  // Filter available paths based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return availablePaths;
    const lower = searchTerm.toLowerCase();
    return availablePaths.filter((p) => p.toLowerCase().includes(lower));
  }, [availablePaths, searchTerm]);

  const addPath = useCallback((path: string) => {
    if (!path) return;
    setSelectedPaths((prev) => Array.from(new Set([...prev, path])));
  }, []);

  const handleAddManualPath = useCallback(() => {
    const trimmed = manualPathInput.trim();
    if (!trimmed) return;
    addPath(trimmed);
    setManualPathInput('');
  }, [manualPathInput, addPath]);

  const handleRemovePath = useCallback((path: string) => {
    setSelectedPaths((prev) => prev.filter((p) => p !== path));
  }, []);

  const handleConfirm = useCallback(() => {
    onUpdatePaths?.(selectedPaths);
    onClose();
  }, [selectedPaths, onClose, onUpdatePaths]);

  return (
    <Dialog
      elevation={0}
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderRadius: 5,
        },
      }}
      aria-labelledby="scan-paths-dialog-title"
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Typography>Manage Scan Paths</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          p: 2,
          bgcolor: theme.palette.background.paper,
        }}
      >
        {/* Search paths */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search paths..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        {/* Manual input for external paths */}
        {allowExternalPaths && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Enter external path..."
              value={manualPathInput}
              onChange={(e) => setManualPathInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddManualPath()}
            />
            <Tooltip title="Add Path">
              <span>
                <IconButton
                  onClick={handleAddManualPath}
                  disabled={!manualPathInput.trim()}
                >
                  <AddIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}

        {/* Available paths */}
        {filteredOptions.length > 0 && (
          <List
            dense
            sx={{
              maxHeight: 200,
              overflowY: 'auto',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
            }}
          >
            {filteredOptions.map((option) => (
              <ListItem
                key={option}
                button
                selected={selectedPaths.includes(option)}
                onClick={() => addPath(option)}
              >
                <ListItemText primary={option} />
              </ListItem>
            ))}
          </List>
        )}

        {/* Selected paths */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {selectedPaths.map((path) => (
            <Chip
              key={path}
              label={truncateFilePath(path)}
              onDelete={() => handleRemovePath(path)}
              size="small"
              color="primary"
            />
          ))}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          justifyContent: 'space-between',
          p: 2,
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={selectedPaths.length === 0}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScanPathsDialog;
