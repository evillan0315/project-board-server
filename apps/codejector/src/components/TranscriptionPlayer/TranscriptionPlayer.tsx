// src/components/TranscriptionPlayer/TranscriptionPlayer.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Slider,
  IconButton,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  Transcribe,
} from '@mui/icons-material';
import { useStore } from '@nanostores/react';
import {
  $mediaStore,
  currentTrackAtom,
  isPlayingAtom,
  progressAtom,
  durationAtom,
  volumeAtom,
  fetchAndLoadTranscription,
  transcribeCurrentAudio,
  updateCurrentTranscriptionSync,
  clearTranscriptionData,
  setPlaying,
  setTrackProgress,
  setTrackDuration,
  setVolume,
  transcriptionResultAtom,
  transcriptionSyncDataAtom,
  isTranscribingAtom,
  transcriptionErrorAtom
} from '@/stores/mediaStore';
import { TranscriptionHighlight } from './TranscriptionHighlight';

interface TranscriptionPlayerProps {
  fileId: string;
  audioUrl: string;
  title?: string;
}

export const TranscriptionPlayer: React.FC<TranscriptionPlayerProps> = ({
  fileId,
  audioUrl,
  title = 'Audio Player',
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Get state from mediaStore
  const mediaStore = useStore($mediaStore);
  const isPlaying = useStore(isPlayingAtom);
  const currentTrack = useStore(currentTrackAtom);
  const progress = useStore(progressAtom);
  const duration = useStore(durationAtom);
  const volume = useStore(volumeAtom);
  const transcriptionData = useStore(transcriptionResultAtom);
  const transcriptionSyncData = useStore(transcriptionSyncDataAtom);
  const isTranscribing = useStore(isTranscribingAtom);
  const transcriptionError = useStore(transcriptionErrorAtom);


  // Audio event handlers
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const newTime = audioRef.current.currentTime;
      setCurrentTime(newTime);
      setTrackProgress(newTime);

      // Update transcription sync data if we have transcription
      if (transcriptionData) {
        // Here, we can directly call updateCurrentTranscriptionSync as the component is
        // responsible for its own playback and transcription display.
        // For MediaPlayerContainer, this logic was moved to a separate useEffect.
        updateCurrentTranscriptionSync(fileId, newTime);
      }
    }
  };

  const handleSeek = (event: Event, newValue: number | number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newValue as number;
      setCurrentTime(newValue as number);
      setTrackProgress(newValue as number);

      // Update transcription sync data immediately after seeking
      if (transcriptionData) {
        updateCurrentTranscriptionSync(fileId, newValue as number);
      }
    }
  };

  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    const volumeValue = newValue as number;
    if (audioRef.current) {
      audioRef.current.volume = volumeValue / 100;
    }
    setVolume(volumeValue);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Load transcription when component mounts or fileId changes
  useEffect(() => {
    // Only fetch if fileId is valid and transcription data is not already loaded for this fileId
    if (fileId && (!transcriptionData || transcriptionData.id !== fileId)) {
      fetchAndLoadTranscription(fileId);
    }

    // Clean up transcription data when component unmounts
    return () => {
      clearTranscriptionData();
    };
  }, [fileId, transcriptionData]); // Added transcriptionData to dependencies to react to its changes

  // Sync audio element with store state
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (
      audioRef.current &&
      Math.abs(audioRef.current.currentTime - progress) > 0.1
    ) {
      audioRef.current.currentTime = progress;
    }
  }, [progress]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      {/* Audio Player Controls */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>

        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setTrackDuration(audioRef.current.duration);
            }
          }}
          onEnded={() => setPlaying(false)}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <IconButton onClick={handlePlayPause} size="large">
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>

          <Box sx={{ flexGrow: 1 }}>
            <Slider
              value={currentTime}
              max={duration}
              onChange={handleSeek}
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">{formatTime(currentTime)}</Typography>
              <Typography variant="body2">{formatTime(duration)}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', width: 100 }}>
            <VolumeUp sx={{ mr: 1 }} />
            <Slider
              value={volume}
              onChange={handleVolumeChange}
              sx={{ width: 60 }}
            />
          </Box>
        </Box>
      </Box>

      {/* Transcription Controls */}
      <Box sx={{ mb: 3 }}>
        {transcriptionError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {transcriptionError}
          </Alert>
        )}



        {!transcriptionData && !isTranscribing && (
          <Button
            variant="contained"
            startIcon={<Transcribe />}
            onClick={() => transcribeCurrentAudio(fileId)}
            disabled={isTranscribing}
          >
            Transcribe Audio
          </Button>
        )}
      </Box>

      {/* Transcription Display */}
      {transcriptionData && !isTranscribing && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Transcription
            </Typography>

            {transcriptionSyncData ? (
              <TranscriptionHighlight
                syncData={transcriptionSyncData}
                currentTime={currentTime}
                fullTranscription={transcriptionData} // Pass full transcription here
                onSeek={(time) => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = time;
                    setCurrentTime(time);
                    setTrackProgress(time);
                  }
                }}
              />
            ) : (
              // If full transcription is loaded but sync data isn't, display full text
              <Typography>{transcriptionData.fullText}</Typography>
            )}
          </CardContent>
        </Card>
      )}
    </Paper>
  );
};
