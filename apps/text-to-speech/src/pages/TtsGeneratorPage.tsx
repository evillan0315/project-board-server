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
  Autocomplete,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Link as RouterLink } from 'react-router-dom';

import type { TtsRequestDto } from '../types/tts';
import { useAuth } from '../hooks/useAuth';

// --- Autocomplete Options ---
const LANGUAGE_CODE_OPTIONS: string[] = [
  'en-US',
  'en-GB',
  'es-ES',
  'fr-FR',
  'de-DE',
  'it-IT',
  'ja-JP',
  'ko-KR',
  'pt-BR',
  'zh-CN',
  'ar-XA',
  'hi-IN',
];

// These voice names are a selection of those allowed by the Google Gemini TTS API
// based on the provided error message. Ideally, these should be fetched dynamically from a backend.
const VOICE_NAME_OPTIONS: string[] = [
  'kore',
  'puck',
  'fenrir',
  'zephyr',
  'achernar',
  'gacrux',
  'umbriel',
  'vindemiatrix',
  'algieba',
  'aoede',
  'autonoe',
  'callirrhoe',
  'charon',
  'despina',
  'enceladus',
  'erinome',
  'iapetus',
  'laomedeia',
  'leda',
  'orus',
  'pulcherrima',
  'rasalgethi',
  'sadachbia',
  'sadaltager',
  'schedar',
  'sulafat',
  'zubenelgenubi',
];

const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    '& fieldset': { borderColor: 'primary.light'},
    '&:hover fieldset': { borderColor: 'primary.main' },
    '&.Mui-focused fieldset': { borderColor: 'primary.dark' },
  },
  '& .MuiInputLabel-root': { color: 'text.secondary' },
  '& .MuiInputBase-input': { color: 'text.primary'  },
};

const speakerTextFieldSx = {
  '& .MuiOutlinedInput-root': {
    '& fieldset': { borderColor: 'secondary.light'},
    '&:hover fieldset': { borderColor: 'secondary.main'  },
    '&.Mui-focused fieldset': { borderColor: 'secondary.dark' },
  },
  '& .MuiInputLabel-root': { color: 'text.dark', },
  '& .MuiInputBase-input': { color: 'text.primary' },
};

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
    bgcolor: 'background.default',
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
          className="flex items-center justify-between"
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
          sx={textFieldSx}
        />

        <Autocomplete
          freeSolo
          options={LANGUAGE_CODE_OPTIONS}
          value={languageCode}
          onChange={(_event, newValue) => {
            setLanguageCode(newValue || '');
          }}
          onInputChange={(_event, newInputValue) => {
            setLanguageCode(newInputValue || '');
          }}
          disabled={loading || !isLoggedIn}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Language Code (e.g., en-US)"
              margin="normal"
              variant="outlined"
              fullWidth
              className="mb-4"
              sx={textFieldSx}
            />
          )}
          className="mb-4"
        />

        <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'text.primary' }}>
          Speakers
        </Typography>
        <Paper elevation={3} sx={{backgroundColor:'background.default', pt:1}}>
        <List dense>
          {speakers.map((speakerData, index) => (
            <ListItem key={speakerData.id} className="flex items-center gap-x-2 mb-2"> { /* Changed space-x-2 to gap-x-2 */}
              <TextField
                label={`Speaker ${index + 1} Name`}
                value={speakerData.speaker}
                onChange={(e) => updateSpeaker(speakerData.id, 'speaker', e.target.value)}
                variant="outlined"
                size="small"
                disabled={loading || !isLoggedIn}
                className="flex-1"
                sx={speakerTextFieldSx}
              />
              <Autocomplete
                freeSolo
                options={VOICE_NAME_OPTIONS}
                value={speakerData.voiceName}
                onChange={(_event, newValue) => {
                  updateSpeaker(speakerData.id, 'voiceName', newValue || '');
                }}
                onInputChange={(_event, newInputValue) => {
                  updateSpeaker(speakerData.id, 'voiceName', newInputValue || '');
                }}
                disabled={loading || !isLoggedIn}
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`Voice Name`}
                    variant="outlined"
                    fullWidth
                    className="flex-1"
                    sx={speakerTextFieldSx}
                  />
                )}
                className="flex-1"
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
          </Paper>
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
          <Alert severity="error" sx={{ mt: 3 }}>
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
          <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
            Generated Audio
          </Typography>
          <audio controls src={audioUrl} className="w-full" />
        </Paper>
      )}
    </Box>
  );
};
