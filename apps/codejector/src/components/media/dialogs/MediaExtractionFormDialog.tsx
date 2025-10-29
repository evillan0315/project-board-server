import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Tooltip,
  InputAdornment,
  Button,
  CircularProgress,
  Alert,
  Typography,
  Box,
} from '@mui/material';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { useTheme } from '@mui/material/styles';
import {
  MediaFileResponseDto,
  CreateMediaDto,
  AllowedMediaFormat,
  allowedMediaFormats,
} from '@/types/refactored/media'; // Corrected import path for types
import { extractMedia as extractMediaFromUrl } from '@/api/media';
import { showGlobalSnackbar } from '@/stores/aiEditorStore';
import { hideDialog } from '@/stores/dialogStore';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';

/**
 * Props for the MediaExtractionFormDialogContent component.
 * This component is intended to be rendered as the 'content' prop of a GlobalDialog.
 */
interface MediaExtractionFormDialogContentProps {
  /** Callback function to be executed upon successful media extraction. */
  onExtractSuccess: (mediaFile: MediaFileResponseDto) => void;
}

/**
 * `MediaExtractionFormDialogContent` provides a form for extracting audio/video
 * from a URL, designed to be used within a `GlobalDialog`.
 * It handles the form state, submission logic, and interaction with the backend API.
 */
const MediaExtractionFormDialogContent: React.FC<MediaExtractionFormDialogContentProps> = ({
  onExtractSuccess,
}) => {
  const theme = useTheme();
  const { isLoggedIn } = useStore(authStore);

  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<AllowedMediaFormat>('webm');
  const [provider, setProvider] = useState('');
  const [cookieAccess, setCookieAccess] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Reset form fields when the component mounts (useful for when GlobalDialog re-renders content)
  useEffect(() => {
    setUrl('');
    setFormat('webm');
    setProvider('');
    setCookieAccess(false);
    setExtractError(null);
    setIsExtracting(false);
  }, []);

  /**
   * Handles the submission of the media extraction form.
   * Validates input, calls the media extraction API, and manages loading/error states.
   */
  const handleSubmit = useCallback(async () => {
    if (!isLoggedIn) {
      showGlobalSnackbar('You must be logged in to extract media.', 'error');
      return;
    }
    if (!url.trim()) {
      setExtractError('URL is required.');
      return;
    }

    setIsExtracting(true);
    setExtractError(null);

    const dto: CreateMediaDto = {
      url: url.trim(),
      format,
      provider: provider.trim() || undefined,
      cookieAccess,
    };

    try {
      const extractedFile = await extractMediaFromUrl(dto);
      onExtractSuccess(extractedFile);
      showGlobalSnackbar(
        `Successfully extracted: ${extractedFile.name}`,
        'success',
      );
      hideDialog(); // Close the global dialog upon success
    } catch (err: any) {
      const message = err.message || 'Failed to extract media.';
      setExtractError(message);
      showGlobalSnackbar(`Extraction failed: ${message}`, 'error');
    } finally {
      setIsExtracting(false);
    }
  }, [isLoggedIn, url, format, provider, cookieAccess, onExtractSuccess]);

  /**
   * Handles the cancellation of the media extraction form, closing the global dialog.
   */
  const handleCancel = useCallback(() => {
    hideDialog(); // Close the global dialog
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      {extractError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {extractError}
        </Alert>
      )}
      <TextField
        autoFocus
        margin="dense"
        id="url"
        label="Media URL (e.g., YouTube link)"
        type="url"
        fullWidth
        variant="outlined"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={isExtracting}
        sx={{ mt: 2 }}
        InputLabelProps={{ shrink: true }}
        InputProps={{
          style: { color: theme.palette.text.primary },
          startAdornment: (
            <InputAdornment position="start">
              <YouTubeIcon sx={{ color: theme.palette.error.main }} />
            </InputAdornment>
          ),
        }}
      />

      <FormControl fullWidth margin="dense" sx={{ mt: 2 }} disabled={isExtracting}>
        <InputLabel id="format-label">Format</InputLabel>
        <Select
          labelId="format-label"
          id="format"
          value={format}
          label="Format"
          onChange={(e) => setFormat(e.target.value as AllowedMediaFormat)}
          sx={{ color: theme.palette.text.primary }}
          inputProps={{ sx: { color: theme.palette.text.primary } }}
        >
          {allowedMediaFormats.map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt.toUpperCase()}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        margin="dense"
        id="provider"
        label="Provider (e.g., youtube, vimeo)"
        type="text"
        fullWidth
        variant="outlined"
        value={provider}
        onChange={(e) => setProvider(e.target.value)}
        disabled={isExtracting}
        sx={{ mt: 2 }}
        InputLabelProps={{ shrink: true }}
        InputProps={{ style: { color: theme.palette.text.primary } }}
      />

      <FormControlLabel
        control={
          <Switch
            checked={cookieAccess}
            onChange={(e) => setCookieAccess(e.target.checked)}
            name="cookieAccess"
            color="primary"
            disabled={isExtracting}
          />
        }
        label={
          <Tooltip title="Enable if the media requires authentication cookies (e.g., private content on supported sites).">
            <Typography variant="body2" color="text.secondary">
              Cookie Access
            </Typography>
          </Tooltip>
        }
        sx={{ mt: 2, '& .MuiFormControlLabel-label': { ml: 1 } }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
        <Button onClick={handleCancel} disabled={isExtracting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={isExtracting || !url.trim()}
          startIcon={isExtracting && <CircularProgress size={20} />}
        >
          Extract
        </Button>
      </Box>
    </Box>
  );
};

export default MediaExtractionFormDialogContent;
