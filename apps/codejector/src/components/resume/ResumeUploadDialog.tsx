import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/system';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import { useDropzone } from 'react-dropzone';

// Define types for props and styles

interface ResumeUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  loading: boolean;
  error: string | null;
}

const StyledDropzone = styled('div')<{ disabled?: boolean }>({
  border: '2px dashed #cccccc',
  borderRadius: '4px',
  padding: '20px',
  textAlign: 'center',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: '#f5f5f5',
  },
});

const StyledDialogContent = styled(DialogContent)({
  padding: '24px',
});

const StyledErrorMessage = styled(Typography)({
  color: 'red',
  marginTop: '16px',
});

const ResumeUploadDialog = ({
  open,
  onClose,
  onUpload,
  loading,
  error,
}: ResumeUploadDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setSelectedFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Upload Resume
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <StyledDialogContent>
        <StyledDropzone {...getRootProps()} disabled={loading}>
          <input {...getInputProps()} />
          {isDragActive ? (
            <Typography>Drop the file here...</Typography>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography>
                Drag 'n' drop a file here, or click to select file
              </Typography>
              <Typography variant="caption">
                Supported formats: PDF, DOCX
              </Typography>
            </Box>
          )}
        </StyledDropzone>
        {selectedFile && (
          <Box
            sx={{
              mt: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography>Selected File: {selectedFile.name}</Typography>
          </Box>
        )}
        {error && (
          <StyledErrorMessage variant="body2">
            Error: {error}
          </StyledErrorMessage>
        )}
      </StyledDialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={loading || !selectedFile}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResumeUploadDialog;
