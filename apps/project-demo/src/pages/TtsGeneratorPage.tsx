import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  ttsStore,
  addSpeaker,
  setPrompt,
  setLanguageCode,
  updateSpeaker,
  removeSpeaker,
  setError,
  generateSpeech,
} from '../stores/ttsStore';

import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  IconButton,
  Paper,
  Alert,
  List,
  ListItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Link as RouterLink } from 'react-router-dom';

import type { TtsRequestDto } from '../types/tts';
import { useAuth } from '../hooks/useAuth';

export const TtsGeneratorPage: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const { prompt, speakers, languageCode, loading, error, audioUrl } = useStore(ttsStore);

  useEffect(() => {
    // Initialize with a default speaker if none exist
    if (speakers.length === 0) {
      addSpeaker();
    }
  }, [speakers.length]);

  const handleGenerate = async () => {
    if (!isLoggedIn) {
      setError('Authentication required. Please log in.');
      return;
    }
    const request: TtsRequestDto = {
      prompt,
      speakers: speakers.map((s) => ({
        speaker: s.speaker,
        voiceName: s.voiceName,
      })),
      languageCode,
    };
    generateSpeech(request);
  };

  const headerSx = {
    color: 'text.primary',
    mb: 3,
    fontWeight: 'bold',
    textAlign: 'center',
    className: 'text-2xl',
  };

  const buttonSx = {
    backgroundColor: 'primary.main',
    color: 'primary.contrastText',
    '&:hover': {
      backgroundColor: 'primary.dark',
    },
  };

  const paperSx = {
    p: 3,
    mb: 3,
    borderRadius: 2,
    boxShadow: 3,
    className: 'bg-white dark:bg-gray-800',
  };

  return (
    <Box className="p-6 max-w-4xl mx-auto">
      <Typography variant="h4" component="h1" sx={headerSx}>
        Gemini Text-to-Speech Generator
      </Typography>

      {!isLoggedIn && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 flex items-center justify-between"
        >
          You are not logged in. Please{' '}
          <RouterLink to="/login" style={{ textDecoration: 'none' }}>
            <Button variant="contained" color="primary" size="small">
              Login
            </Button>
          </RouterLink>{' '}
          to generate speech.
        </Alert>
      )}

      <Paper sx={paperSx}>
        <TextField
          label="Text Prompt"
          multiline
          rows={6}
          fullWidth
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          margin="normal"
          variant="outlined"
          disabled={loading || !isLoggedIn}
          className="mb-4"
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: 'primary.light' },
              '&:hover fieldset': { borderColor: 'primary.main' },
              '&.Mui-focused fieldset': { borderColor: 'primary.dark' },
            },
            '& .MuiInputLabel-root': { color: 'text.secondary' },
            '& .MuiInputBase-input': { color: 'text.primary' },
          }}
        />

        <TextField
          label="Language Code (e.g., en-US)"
          fullWidth
          value={languageCode}
          onChange={(e) => setLanguageCode(e.target.value)}
          margin="normal"
          variant="outlined"
          disabled={loading || !isLoggedIn}
          className="mb-4"
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: 'primary.light' },
              '&:hover fieldset': { borderColor: 'primary.main' },
              '&.Mui-focused fieldset': { borderColor: 'primary.dark' },
            },
            '& .MuiInputLabel-root': { color: 'text.secondary' },
            '& .MuiInputBase-input': { color: 'text.primary' },
          }}
        />

        <Typography
          variant="h6"
          sx={{ mt: 2, mb: 1 }}
          className="text-lg font-semibold text-gray-700 dark:text-gray-300"
        >
          Speakers
        </Typography>
        <List dense>
          {speakers.map((speakerData, index) => (
            <ListItem key={speakerData.id} className="flex items-center space-x-2 mb-2">
              <TextField
                label={`Speaker ${index + 1} Name`}
                value={speakerData.speaker}
                onChange={(e) => updateSpeaker(speakerData.id, 'speaker', e.target.value)}
                variant="outlined"
                size="small"
                disabled={loading || !isLoggedIn}
                className="flex-1"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'secondary.light' },
                    '&:hover fieldset': { borderColor: 'secondary.main' },
                    '&.Mui-focused fieldset': { borderColor: 'secondary.dark' },
                  },
                  '& .MuiInputLabel-root': { color: 'text.secondary' },
                  '& .MuiInputBase-input': { color: 'text.primary' },
                }}
              />
              <TextField
                label={`Voice Name (e.g., en-US-Studio-F, en-US-Studio-B)`}
                value={speakerData.voiceName}
                onChange={(e) =>
                  updateSpeaker(speakerData.id, 'voiceName', e.target.value)
                }
                variant="outlined"
                size="small"
                disabled={loading || !isLoggedIn}
                className="flex-1"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'secondary.light' },
                    '&:hover fieldset': { borderColor: 'secondary.main' },
                    '&.Mui-focused fieldset': { borderColor: 'secondary.dark' },
                  },
                  '& .MuiInputLabel-root': { color: 'text.secondary' },
                  '& .MuiInputBase-input': { color: 'text.primary' },
                }}
              />
              {speakers.length > 1 && (
                <IconButton
                  onClick={() => removeSpeaker(speakerData.id)}
                  color="error"
                  disabled={loading || !isLoggedIn}
                  aria-label="remove speaker"
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </ListItem>
          ))}
        </List>
        <Button
          onClick={addSpeaker}
          startIcon={<AddIcon />}
          variant="outlined"
          color="secondary"
          sx={{ mt: 2 }}
          disabled={loading || !isLoggedIn}
        >
          Add Speaker
        </Button>

        {error && (
          <Alert
            severity="error"
            sx={{ mt: 3 }}
            className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
          >
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            onClick={handleGenerate}
            variant="contained"
            sx={buttonSx}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
            disabled={
              loading ||
              !isLoggedIn ||
              !prompt.trim() ||
              speakers.some((s) => !s.speaker.trim() || !s.voiceName.trim())
            }
            className="w-full py-3 text-lg font-bold"
          >
            {loading ? 'Generating Speech...' : 'Generate Speech'}
          </Button>
        </Box>
      </Paper>

      {audioUrl && (
        <Paper sx={paperSx}>
          <Typography
            variant="h6"
            sx={{ mb: 2 }}
            className="text-lg font-semibold text-gray-700 dark:text-gray-300"
          >
            Generated Audio
          </Typography>
          <audio controls src={audioUrl} className="w-full" />
        </Paper>
      )}
    </Box>
  );
};
