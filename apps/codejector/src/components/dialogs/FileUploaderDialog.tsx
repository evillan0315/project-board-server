import React, { useState, useCallback, ChangeEvent, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Alert,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

interface FileUploaderDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (
    base64Data: string | null,
    mimeType: string | null,
    fileName: string | null,
  ) => void; // Updated signature
  currentUploadedFile: string | null;
  currentUploadedMimeType: string | null;
}

const FileUploaderDialog: React.FC<FileUploaderDialogProps> = ({
  open,
  onClose,
  onUpload,
  currentUploadedFile,
  currentUploadedMimeType,
}) => {
  const theme = useTheme();
  const [dragActive, setDragActive] = useState(false);
  const [base64Input, setBase64Input] = useState<string>('');
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = useCallback(
    (files: FileList | null) => {
      if (files && files.length > 0) {
        setFileError(null);
        const file = files[0];
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = (reader.result as string).split(',')[1]; // Get base64 part
          onUpload(base64String, file.type, file.name); // Pass file name
          setBase64Input(reader.result as string); // Show full data URL in textfield
        };
        reader.onerror = (error) => {
          setFileError(`Failed to read file: ${error}`);
          onUpload(null, null, null);
        };
        reader.readAsDataURL(file);
      } else {
        setFileError('No file selected.');
      }
    },
    [onUpload],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileChange(e.dataTransfer.files);
        e.dataTransfer.clearData();
      }
    },
    [handleFileChange],
  );

  const handleBase64InputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setBase64Input(e.target.value);
  };

  const handlePasteBase64 = () => {
    if (base64Input) {
      // Basic validation for data URL format
      const regex =
        /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+)?;base64,([a-zA-Z0-9\/+=]+)$/;
      const match = base64Input.match(regex);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        // Try to infer a generic file name for pasted data, or leave null
        const inferredFileName = mimeType
          ? `pasted_file.${mimeType.split('/').pop()}`
          : 'pasted_file.bin';
        onUpload(base64Data, mimeType, inferredFileName);
        setBase64Input(base64Input); // Keep the data URL in the text field
        setFileError(null);
      } else {
        setFileError('Invalid Base64 data URL format.');
        onUpload(null, null, null);
      }
    } else {
      onUpload(null, null, null);
    }
  };

  const handleClear = () => {
    onUpload(null, null, null);
    setBase64Input('');
    setFileError(null);
  };

  // When dialog opens, populate base64Input with currentUploadedFile if available
  useEffect(() => {
    if (open && currentUploadedFile) {
      setBase64Input(
        `data:${currentUploadedMimeType || 'application/octet-stream'};base64,${currentUploadedFile}`,
      );
    } else if (!open) {
      // Clear local state when dialog closes
      setBase64Input('');
      setFileError(null);
      setDragActive(false);
    }
  }, [open, currentUploadedFile, currentUploadedMimeType]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pr: 1,
        }}
      >
        <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
          Upload File or Paste Base64
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: theme.palette.text.secondary }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        {fileError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {fileError}
          </Alert>
        )}

        <Typography
          variant="subtitle1"
          sx={{ mb: 1, color: theme.palette.text.primary }}
        >
          Drag & Drop File
        </Typography>
        <Box
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          sx={{
            border: `2px dashed ${dragActive ? theme.palette.primary.main : theme.palette.divider}`,
            borderRadius: 1,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: dragActive
              ? theme.palette.action.hover
              : theme.palette.background.default,
            mb: 2,
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <input
            type="file"
            multiple={false}
            onChange={(e) => handleFileChange(e.target.files)}
            style={{ display: 'none' }}
            id="file-upload-input"
          />
          <label htmlFor="file-upload-input">
            <IconButton component="span" color="primary" size="large">
              <CloudUploadIcon sx={{ fontSize: 48 }} />
            </IconButton>
            <Typography
              variant="body1"
              sx={{ color: theme.palette.text.secondary }}
            >
              Drag files here or click to browse
            </Typography>
          </label>
        </Box>

        <Typography
          variant="subtitle1"
          sx={{ mb: 1, color: theme.palette.text.primary }}
        >
          Or Paste Base64 Data URL
        </Typography>
        <TextField
          label="Base64 Data URL"
          multiline
          rows={4}
          value={base64Input}
          onChange={handleBase64InputChange}
          placeholder="e.g., data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
          fullWidth
          variant="outlined"
          InputLabelProps={{
            shrink: true,
            style: { color: theme.palette.text.secondary },
          }}
          InputProps={{ style: { color: theme.palette.text.primary } }}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            onClick={handlePasteBase64}
            variant="contained"
            color="primary"
            startIcon={<ContentPasteIcon />}
            disabled={!base64Input}
          >
            Apply Base64
          </Button>
          <Button
            onClick={handleClear}
            variant="outlined"
            color="secondary"
            startIcon={<DeleteForeverIcon />}
            disabled={!currentUploadedFile && !base64Input}
          >
            Clear
          </Button>
        </Box>

        {currentUploadedFile && (
          <Alert severity="info" sx={{ mt: 2 }}>
            File/Image currently uploaded:{' '}
            <Typography component="span" fontWeight="bold">
              {currentUploadedMimeType || 'unknown mime type'}
            </Typography>{' '}
            ({(currentUploadedFile.length / 1024).toFixed(2)} KB)
          </Alert>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          p: 2,
          justifyContent: 'flex-end',
        }}
      >
        <Button onClick={onClose} sx={{ color: theme.palette.text.secondary }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileUploaderDialog;
