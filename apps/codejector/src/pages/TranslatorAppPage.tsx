import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Paper,
  useTheme,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  // Removed Snackbar from @mui/material
} from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import {
  translatorStore,
  setInputText,
  setUploadedFile,
  setTargetLanguage,
  setTranslatedContent,
  setLoading,
  setError,
  clearTranslatorState,
} from '@/stores/translatorStore';
import { FileUploaderDialog } from '@/components/dialogs';
import { translateContent } from '@/api/translation';
import { authStore } from '@/stores/authStore';
import CodeMirror from '@uiw/react-codemirror';
import { getCodeMirrorLanguage, createCodeMirrorTheme } from '@/utils';
import { themeStore } from '@/stores/themeStore';
import { showGlobalSnackbar } from '@/stores/aiEditorStore'; // Import global snackbar

const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh-Hans', name: 'Chinese (Simplified)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'id', name: 'Indonesian' },
];

const TranslatorAppPage: React.FC = () => {
  const muiTheme = useTheme(); // Get MUI theme
  const { mode } = useStore(themeStore);
  const { isLoggedIn } = useStore(authStore);
  const {
    inputText,
    uploadedFileData,
    uploadedFileName,
    uploadedFileMimeType,
    targetLanguage,
    translatedContent,
    loading,
    error,
  } = useStore(translatorStore);

  const [isFileUploaderOpen, setIsFileUploaderOpen] = useState(false);

  useEffect(
    () =>
      // Clear state on component unmount or if not logged in (optional based on app flow)
      () => {
        clearTranslatorState();
      },
    [],
  );

  const handleTranslate = useCallback(async () => {
    if (!isLoggedIn) {
      setError('You must be logged in to use the translator.');
      return;
    }
    if (!inputText && !uploadedFileData) {
      setError('Please enter text or upload a file to translate.');
      return;
    }

    setLoading(true);
    setError(null);
    setTranslatedContent(null);

    try {
      const result = await translateContent({
        content: inputText,
        fileData: uploadedFileData,
        fileName: uploadedFileName, // Pass fileName to the translation API
        fileMimeType: uploadedFileMimeType,
        targetLanguage: targetLanguage,
      });
      setTranslatedContent(result);
    } catch (err) {
      setError(
        `Translation failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setLoading(false);
    }
  }, [
    isLoggedIn,
    inputText,
    uploadedFileData,
    uploadedFileName, // Added to dependencies
    uploadedFileMimeType,
    targetLanguage,
  ]);

  const handleUploadFile = useCallback(
    (
      data: string | null,
      mimeType: string | null,
      fileName: string | null, // Added fileName parameter
    ) => {
      setUploadedFile(data, mimeType, fileName);
      setIsFileUploaderOpen(false);
    },
    [],
  );

  const handleClearInputs = useCallback(() => {
    clearTranslatorState();
  }, []);

  const handleCopyToClipboard = useCallback(() => {
    if (translatedContent) {
      navigator.clipboard.writeText(translatedContent);
      showGlobalSnackbar('Translated content copied to clipboard!', 'success'); // Use global snackbar
    }
  }, [translatedContent]);

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        mx: 'auto',
        my: 4,
        maxWidth: '1200px',
        width: '100%',
        bgcolor: muiTheme.palette.background.paper,
        color: muiTheme.palette.text.primary,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        flexGrow: 1,
        minHeight: 'calc(100vh - 120px)', // Adjust based on Navbar/Footer height
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        sx={{
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <TranslateIcon sx={{ fontSize: 40 }} /> AI Translator
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Translate text or upload a file to get an AI-powered translation.
      </Typography>

      {!isLoggedIn && (
        <Alert severity="warning">
          Please log in to use the AI Translator.
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {/* Source Input */}
        <Box
          sx={{
            flex: '1 1 45%',
            minWidth: '300px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <TextField
            label="Text to Translate (or upload a file below)"
            multiline
            rows={10}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading || uploadedFileData !== null || !isLoggedIn}
            fullWidth
            placeholder="Enter text here..."
            InputLabelProps={{ shrink: true }}
            InputProps={{ style: { color: muiTheme.palette.text.primary } }}
            sx={{ flexGrow: 1 }}
          />

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={() => setIsFileUploaderOpen(true)}
              disabled={loading || !isLoggedIn}
            >
              {uploadedFileName
                ? `Change File (${uploadedFileName})`
                : 'Upload File'}
            </Button>
            {uploadedFileName && (
              <Typography variant="body2" color="text.secondary">
                {uploadedFileName} (
                {(uploadedFileData?.length || 0) / 1024 < 1
                  ? '< 1'
                  : ((uploadedFileData?.length || 0) / 1024).toFixed(2)}{' '}
                KB)
              </Typography>
            )}
          </Box>
        </Box>

        {/* Controls and Target Language */}
        <Box
          sx={{
            flex: '1 1 45%',
            minWidth: '300px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <FormControl fullWidth disabled={loading || !isLoggedIn}>
            <InputLabel id="target-language-label">Target Language</InputLabel>
            <Select
              labelId="target-language-label"
              id="target-language-select"
              value={targetLanguage}
              label="Target Language"
              onChange={(e) => setTargetLanguage(e.target.value as string)}
              sx={{ color: muiTheme.palette.text.primary }}
              inputProps={{ sx: { color: muiTheme.palette.text.primary } }}
            >
              {supportedLanguages.map((lang) => (
                <MenuItem key={lang.code} value={lang.name}>
                  {lang.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="primary"
            startIcon={
              loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <TranslateIcon />
              )
            }
            onClick={handleTranslate}
            disabled={
              loading || (!inputText && !uploadedFileData) || !isLoggedIn
            }
            fullWidth
            sx={{ py: 1.5, fontSize: '1.05rem' }}
          >
            {loading ? 'Translating...' : 'Translate'}
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ClearAllIcon />}
            onClick={handleClearInputs}
            disabled={
              loading ||
              (!inputText && !uploadedFileData && !translatedContent) ||
              !isLoggedIn
            }
            fullWidth
          >
            Clear All
          </Button>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </Box>

      {/* Translated Output */}
      <Box sx={{ mt: 3, flexGrow: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          Translated Content
          <Tooltip title="Copy to Clipboard">
            <IconButton
              onClick={handleCopyToClipboard}
              size="small"
              sx={{ ml: 1 }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>
        <CodeMirror
          value={translatedContent || 'Translation will appear here...'}
          extensions={[
            getCodeMirrorLanguage(uploadedFileName || '.txt'), // Language extensions
            createCodeMirrorTheme(muiTheme), // Add custom theme here
          ]}
          theme={mode}
          editable={false}
          minHeight="200px"
          maxHeight="50vh"
          style={{
            borderRadius: muiTheme.shape.borderRadius + 'px',
            border: `1px solid ${muiTheme.palette.divider}`,
            overflow: 'hidden',
            fontSize: '0.9rem',
          }}
        />
      </Box>

      <FileUploaderDialog
        open={isFileUploaderOpen}
        onClose={() => setIsFileUploaderOpen(false)}
        onUpload={(data, mimeType, fileName) =>
          handleUploadFile(data, mimeType, fileName)
        } // Pass fileName
        currentUploadedFile={uploadedFileData}
        currentUploadedMimeType={uploadedFileMimeType}
      />
    </Paper>
  );
};

export default TranslatorAppPage;
