import React, { useState, useEffect, useMemo, useCallback, ChangeEvent } from 'react';
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
  TextField,
  InputAdornment,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  CloudUpload as CloudUploadIcon,
  ContentPaste as ContentPasteIcon,
  DeleteForever as DeleteForeverIcon,
} from '@mui/icons-material';
import { useStore } from '@nanostores/react';
import {
  fileTreeStore,
  loadInitialTree,
  projectRootDirectoryStore,
  flatFileListStore,
} from '@/stores/fileTreeStore';
import { getFileTypeIcon } from '@/constants/fileIcons';

interface FileManagerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (selectedPaths: string[]) => void;
  currentScanPaths: string[];
  onUpload: (base64Data: string | null, mimeType: string | null, fileName: string | null) => void;
  currentUploadedFile: string | null;
  currentUploadedMimeType: string | null;
}

const FileManagerDialog: React.FC<FileManagerDialogProps> = ({
  open,
  onClose,
  onSelect,
  currentScanPaths,
  onUpload,
  currentUploadedFile,
  currentUploadedMimeType,
}) => {
  const theme = useTheme();

  /** ---------- Stores ---------- **/
  const { files, isFetchingTree, fetchTreeError, lastFetchedProjectRoot } = useStore(fileTreeStore);
  const projectRootDirectory = useStore(projectRootDirectoryStore);
  const flatFiles = useStore(flatFileListStore);

  /** ---------- State ---------- **/
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [base64Input, setBase64Input] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);

  /** ---------- File Tree Handling ---------- **/
  useEffect(() => {
    if (open && projectRootDirectory && lastFetchedProjectRoot !== projectRootDirectory) {
      loadInitialTree(projectRootDirectory);
    }
  }, [open, projectRootDirectory, lastFetchedProjectRoot]);

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

  const sortedFiles = useMemo(() => [...filteredFiles].sort((a, b) => a.filePath.localeCompare(b.filePath)), [filteredFiles]);

  const handleSelectAll = useCallback(() => setSelectedPaths(new Set(sortedFiles.map(f => f.filePath))), [sortedFiles]);
  const handleDeselectAll = useCallback(() => setSelectedPaths(new Set()), []);
  const handleConfirm = useCallback(() => { onSelect(Array.from(selectedPaths)); onClose(); }, [onSelect, onClose, selectedPaths]);

  /** ---------- File Upload / Base64 Handling ---------- **/
  const handleFileRead = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      onUpload(base64, file.type, file.name);
      setBase64Input(dataUrl);
      setFileError(null);
    };
    reader.onerror = () => {
      setFileError('Failed to read file.');
      onUpload(null, null, null);
    };
    reader.readAsDataURL(file);
  }, [onUpload]);

  const handleFileChange = useCallback((files: FileList | null) => {
    if (files?.length) handleFileRead(files[0]);
    else setFileError('No file selected.');
  }, [handleFileRead]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      handleFileChange(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  }, [handleFileChange]);

  const handlePasteBase64 = useCallback(() => {
    const regex = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+)?;base64,([a-zA-Z0-9+/=]+)$/;
    const match = base64Input.match(regex);
    if (match) {
      const mimeType = match[1] || 'application/octet-stream';
      const base64Data = match[2];
      const fileName = `pasted_file.${mimeType.split('/').pop()}`;
      onUpload(base64Data, mimeType, fileName);
      setFileError(null);
    } else {
      setFileError('Invalid Base64 data URL format.');
      onUpload(null, null, null);
    }
  }, [base64Input, onUpload]);

  const handleClear = useCallback(() => {
    setBase64Input('');
    setFileError(null);
    onUpload(null, null, null);
  }, [onUpload]);

  useEffect(() => {
    if (open && currentUploadedFile) {
      setBase64Input(`data:${currentUploadedMimeType || 'application/octet-stream'};base64,${currentUploadedFile}`);
    } else if (!open) {
      handleClear();
      setDragActive(false);
    }
  }, [open, currentUploadedFile, currentUploadedMimeType, handleClear]);

  /** ---------- Render ---------- **/
  const projectRootLabel = projectRootDirectory ? `Relative to: ${projectRootDirectory}` : 'No project root loaded';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: theme.palette.background.paper } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
        <Typography variant="h6" fontWeight="bold">Files & Upload</Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: theme.palette.text.secondary }}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        {/* ---------- File Tree ---------- */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{projectRootLabel}</Typography>
        <TextField
          fullWidth size="small" placeholder="Search files..."
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
            sx: { color: theme.palette.text.primary, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main } },
          }}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
          <Button variant="outlined" size="small" onClick={handleSelectAll} disabled={isFetchingTree || !sortedFiles.length}>Select All</Button>
          <Button variant="outlined" size="small" onClick={handleDeselectAll} disabled={isFetchingTree || !sortedFiles.length}>Deselect All</Button>
        </Box>
        {isFetchingTree ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, gap: 1 }}>
            <CircularProgress size={24} /><Typography variant="body2" color="text.secondary">Loading files...</Typography>
          </Box>
        ) : fetchTreeError ? (
          <Alert severity="error">{fetchTreeError}</Alert>
        ) : sortedFiles.length === 0 ? (
          <Alert severity="info">{searchTerm ? 'No matching files found.' : 'No files available in the project root.'}</Alert>
        ) : (
          <List dense sx={{ maxHeight: 300, overflowY: 'auto', border: `1px solid ${theme.palette.divider}`, borderRadius: 1, bgcolor: theme.palette.background.default, mb: 2 }}>
            {sortedFiles.map(f => (
              <ListItem key={f.filePath} secondaryAction={<Checkbox checked={selectedPaths.has(f.filePath)} onChange={() => handleTogglePath(f.filePath)} sx={{ color: theme.palette.primary.main }} />} sx={{ '&:hover': { bgcolor: theme.palette.action.hover } }}>
                <ListItemIcon>{getFileTypeIcon(f.filePath, 'file')}</ListItemIcon>
                <ListItemText primary={f.filePath} primaryTypographyProps={{ color: theme.palette.text.primary }} />
              </ListItem>
            ))}
          </List>
        )}

        {/* ---------- File Upload ---------- */}
        {fileError && <Alert severity="error" sx={{ mb: 2 }}>{fileError}</Alert>}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Drag & Drop File</Typography>
        <Box
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          sx={{ border: `2px dashed ${dragActive ? theme.palette.primary.main : theme.palette.divider}`, borderRadius: 1, p: 4, textAlign: 'center', cursor: 'pointer', bgcolor: dragActive ? theme.palette.action.hover : theme.palette.background.default, mb: 2, transition: 'all 0.2s ease-in-out' }}
        >
          <input type="file" onChange={e => handleFileChange(e.target.files)} style={{ display: 'none' }} id="file-upload-input" />
          <label htmlFor="file-upload-input">
            <CloudUploadIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />
            <Typography variant="body1" color="text.secondary">Drag files here or click to browse</Typography>
          </label>
        </Box>
        <TextField
          label="Base64 Data URL" multiline rows={4} value={base64Input}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setBase64Input(e.target.value)}
          placeholder="data:image/png;base64,..." fullWidth variant="outlined"
          InputLabelProps={{ shrink: true, style: { color: theme.palette.text.secondary } }}
          InputProps={{ style: { color: theme.palette.text.primary } }} sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={handlePasteBase64} variant="contained" color="primary" startIcon={<ContentPasteIcon />} disabled={!base64Input}>Apply Base64</Button>
          <Button onClick={handleClear} variant="outlined" color="secondary" startIcon={<DeleteForeverIcon />} disabled={!currentUploadedFile && !base64Input}>Clear</Button>
        </Box>
        {currentUploadedFile && (
          <Alert severity="info" sx={{ mt: 2 }}>
            File/Image uploaded: <Typography component="span" fontWeight="bold">{currentUploadedMimeType || 'unknown'}</Typography> ({(currentUploadedFile.length / 1024).toFixed(2)} KB)
          </Alert>
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

export default FileManagerDialog;

