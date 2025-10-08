import React, { useRef, useEffect, useCallback } from 'react';
import { Box, Paper, Button, CircularProgress, Alert } from '@mui/material';
import MediaPlayer from '@/components/ui/player/MediaPlayer';
import {
  $mediaStore,
  isPlayingAtom,
  currentTrackAtom,
  volumeAtom,
  repeatModeAtom,
  progressAtom,
  durationAtom,
  bufferedAtom,
  setMediaElement,
  setPlaying,
  setTrackProgress,
  setTrackDuration,
  setBuffered,
  setVolume,
  setError,
  setLoading,
  nextTrack,
  isVideoModalOpenAtom,
  showTranscriptionAtom,
  transcriptionSyncDataAtom,
  transcriptionResultAtom,
  isTranscribingAtom,
  transcriptionErrorAtom,
  fetchAndLoadTranscription,
  transcribeCurrentAudio,
  updateCurrentTranscriptionSync,
  clearTranscriptionData,
} from '@/stores/mediaStore';
import { useStore } from '@nanostores/react';
import { FileType, BufferedRange } from '@/types/refactored/media';
import { TranscriptionHighlight } from '@/components/TranscriptionPlayer/TranscriptionHighlight';

const MediaError = {
  MEDIA_ERR_ABORTED: 1,
  MEDIA_ERR_NETWORK: 2,
  MEDIA_ERR_DECODE: 3,
  MEDIA_ERR_SRC_NOT_SUPPORTED: 4,
};

// Styles for the fixed Transcription Highlights panel
const transcriptionPanelSx = {
  position: 'fixed',
  bottom: 52, // Distance from the top of the viewport
  left: '50%',
  transform: 'translateX(-50%)', // Center horizontally
  width: 'calc(100% - 32px)', // Full width minus some padding on smaller screens
  maxWidth: 500, // Maximum width for larger screens
  maxHeight: 200, // Keep max height for vertical scrolling
  overflowY: 'auto',
  p: 2,
  zIndex: 1000, // Ensure it floats above most other content
  bgcolor: 'background.paper', // Use theme background color
  borderRadius: 2, // Slightly rounded corners
  boxShadow: 6, // Add some shadow for floating effect
};

const MediaPlayerContainer: React.FC = () => {
  const internalMediaElementRef = useRef<HTMLMediaElement | null>(null);

  // State from mediaStore
  const currentTrack = useStore(currentTrackAtom);
  const isPlaying = useStore(isPlayingAtom);
  const volume = useStore(volumeAtom);
  const repeatMode = useStore(repeatModeAtom);
  const progress = useStore(progressAtom);
  const duration = useStore(durationAtom);
  const buffered = useStore(bufferedAtom);
  const isVideoModalOpen = useStore(isVideoModalOpenAtom);
  const { isFetchingMedia: loading, fetchMediaError: error } = useStore($mediaStore);

  // Transcription State
  const showTranscription = useStore(showTranscriptionAtom);
  const transcriptionResult = useStore(transcriptionResultAtom);
  const transcriptionSyncData = useStore(transcriptionSyncDataAtom);
  const isTranscribing = useStore(isTranscribingAtom);
  const transcriptionError = useStore(transcriptionErrorAtom);

  // Event handlers for the active media element, defined at the top level
  const handleTimeUpdate = useCallback(() => {
    const media = $mediaStore.get().mediaElement; // Use the globally registered media element
    if (media && currentTrack) {
      const newProgress = Math.floor(media.currentTime);
      if (Math.abs(newProgress - progress) > 0) {
        setTrackProgress(newProgress);
      }
      // Update duration if it's not set or significantly different (e.g., for streams)
      if (
        media.duration &&
        !isNaN(media.duration) &&
        Math.abs(media.duration - duration) > 1
      ) {
        setTrackDuration(Math.floor(media.duration));
      }
      // Transcription sync moved to a dedicated useEffect below for better control
    }
  }, [currentTrack, progress, duration]); // Removed showTranscription, transcriptionResult from dependencies

  // Handle 'progress' event to update buffered ranges
  const handleProgress = useCallback(() => {
    const media = $mediaStore.get().mediaElement; // Use the globally registered media element
    if (media && media.buffered.length > 0) {
      const newBufferedRanges: BufferedRange[] = [];
      for (let i = 0; i < media.buffered.length; i++) {
        newBufferedRanges.push({
          start: media.buffered.start(i),
          end: media.buffered.end(i),
        });
      }
      // Only update if the ranges have actually changed to avoid unnecessary re-renders
      if (JSON.stringify(newBufferedRanges) !== JSON.stringify(buffered)) {
        setBuffered(newBufferedRanges);
      }
    } else if (buffered.length > 0) {
      // If no buffered ranges, clear them
      setBuffered([]);
    }
  }, [buffered]);

  const handleVolumeChange = useCallback(() => {
    const media = $mediaStore.get().mediaElement; // Use the globally registered media element
    if (media) {
      setVolume(Math.round(media.volume * 100));
    }
  }, []);

  const handleEnded = useCallback(() => {
    const media = $mediaStore.get().mediaElement;
    if (media) {
      if (repeatMode === 'track') {
        media.currentTime = 0;
        // Attempt to play, catch potential errors like autoplay policy blocking
        media.play().catch((e) => {
          console.error('Playback failed on repeat track (MediaPlayerContainer):', e);
          setError('Failed to repeat track. User interaction might be required.');
          setPlaying(false); // Explicitly pause in store if repeat play fails
        });
        // Note: isPlayingAtom does not need to be explicitly set to true here.
        // If it was playing before, it should remain true. If `media.play()` fails,
        // the catch block handles setting it to false.
      } else {
        setPlaying(false); // Only set to false if NOT repeating (e.g., for 'off' or 'context' modes)
        nextTrack(); // Go to next track or stop if queue ends
      }
    }
  }, [repeatMode, nextTrack, setError, setPlaying]); // Added setPlaying, setError to deps

  const handlePlaying = useCallback(() => {
    setLoading(false);
    // setPlaying(true); // This is now controlled by the useEffect below
    setError(null);
  }, []);

  const handlePause = useCallback(() => {
    // setPlaying(false); // This is now controlled by the useEffect below
  }, []);

  const handleWaiting = useCallback(() => {
    setLoading(true);
  }, []);

  // Crucial for starting playback after media is ready
  const handleCanPlay = useCallback(() => {
    const media = $mediaStore.get().mediaElement; // Use the globally registered media element
    // If the store intends to play, and media is ready, call play()
    if (media && isPlaying && currentTrack) {
      media.play().catch((e) => {
        console.error('Playback failed on canplay (MediaPlayerContainer):', e);
        setError('Audio playback prevented. User interaction required.');
        setPlaying(false); // Pause the store if autoplay failed
      });
    }
  }, [isPlaying, currentTrack]);

  const handleError = useCallback((e: Event) => {
    const mediaTarget = e.target as HTMLMediaElement;
    const mediaError = mediaTarget.error;
    let errorMessage = 'Failed to play media. Please try another file.';

    if (mediaError) {
      switch (mediaError.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Media playback aborted by user.';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error: Media file could not be downloaded.';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = (
            'Media decoding error: The media file is corrupted or unsupported.'
          );
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Media format not supported by your browser.';
          break;
        default:
          errorMessage = `Media playback error (${mediaError.code}): ${mediaError.message || 'Unknown error'}.`;
          break;
      }
    }
    console.error('Media playback error details:', e, mediaError);
    setError(errorMessage);
    setLoading(false);
    setPlaying(false); // Ensure store reflects paused state on error
  }, []);

  const handleTranscriptionSeek = useCallback(
    (time: number) => {
      const media = $mediaStore.get().mediaElement;
      if (media) {
        media.currentTime = time;
        setTrackProgress(time);
      }
    },
    [setTrackProgress],
  );

  // Effect to manage the internal media element and register it with the global store
  useEffect(() => {
    const media = internalMediaElementRef.current;
    // Only manage this internal element if a track is present and it's an AUDIO file.
    // Video files are managed by VideoModal when it's open, which sets the global mediaElement.
    if (currentTrack?.fileType === FileType.AUDIO && media) {
      setMediaElement(media);
      // Ensure volume is synced initially
      media.volume = volume / 100;
    } else if (media && $mediaStore.get().mediaElement === media) {
      // If this internal element was previously registered but is no longer the active one (e.g., video modal opened),
      // or if currentTrack became null, clear it from the store.
      setMediaElement(null);
    }

    // Event listeners are attached/detached based on whether this component's element is deemed active.
    // This ensures listeners only apply to the currently controlled media element.
    if (media && currentTrack?.fileType === FileType.AUDIO) {
      media.addEventListener('timeupdate', handleTimeUpdate);
      media.addEventListener('volumechange', handleVolumeChange);
      media.addEventListener('ended', handleEnded);
      media.addEventListener('playing', handlePlaying);
      media.addEventListener('pause', handlePause);
      media.addEventListener('waiting', handleWaiting);
      media.addEventListener('canplay', handleCanPlay);
      media.addEventListener('error', handleError);
      media.addEventListener('progress', handleProgress);
    }

    return () => {
      if (media) {
        media.removeEventListener('timeupdate', handleTimeUpdate);
        media.removeEventListener('volumechange', handleVolumeChange);
        media.removeEventListener('ended', handleEnded);
        media.removeEventListener('playing', handlePlaying);
        media.removeEventListener('pause', handlePause);
        media.removeEventListener('waiting', handleWaiting);
        media.removeEventListener('canplay', handleCanPlay);
        media.removeEventListener('error', handleError);
        media.removeEventListener('progress', handleProgress);
      }
    };
  }, [currentTrack?.fileType, internalMediaElementRef.current, volume,
      handleTimeUpdate, handleVolumeChange, handleEnded, handlePlaying,
      handlePause, handleWaiting, handleCanPlay, handleError, handleProgress,
  ]);

  // Effect to control play/pause based on the global isPlayingAtom state.
  // This handles user-initiated play/pause toggles or initial state sync.
  useEffect(() => {
    const media = $mediaStore.get().mediaElement;
    if (!media || isVideoModalOpen) return; // Do not control if media element is not available or video modal is open

    if (isPlaying) {
      if (media.paused && currentTrack) { // Only attempt to play if currently paused and a track is loaded
        media.play().catch((e) => {
          console.error('Autoplay failed from isPlaying useEffect (MediaPlayerContainer):', e);
          setError('Audio playback prevented. User interaction required.');
          setPlaying(false); // Reflect actual playback state if autoplay is blocked
        });
      }
    } else {
      if (!media.paused) {
        media.pause();
      }
    }
  }, [isPlaying, $mediaStore.get().mediaElement, currentTrack, isVideoModalOpen]);

  // Effect to manage initial transcription loading for the current track
  useEffect(() => {
    if (currentTrack?.id && showTranscription && currentTrack.fileType === FileType.AUDIO) {
      // Only fetch if transcription data for the current track is NOT already loaded or is for a different track
      if (!transcriptionResult || transcriptionResult.id !== currentTrack.id) {
        fetchAndLoadTranscription(currentTrack.id);
      }
    } else if (currentTrack?.id !== transcriptionResult?.id) {
      // If track changed or transcription is hidden, and transcriptionResult doesn't match currentTrack, clear it.
      // This handles cases where metadata might have loaded a transcription for a previous track.
      clearTranscriptionData();
    } else if (!currentTrack && transcriptionResult) {
      // If no current track and transcriptionResult is present, clear it
      clearTranscriptionData();
    }
  }, [currentTrack?.id, showTranscription, currentTrack?.fileType, transcriptionResult?.id]); // Depend on transcriptionResult.id to react to changes in loaded transcription for *this* track

  // Effect to manage transcription sync data based on progress and loaded transcriptionResult
  // This effect will trigger updateCurrentTranscriptionSync when playback progresses AND transcription data is available.
  useEffect(() => {
    const media = $mediaStore.get().mediaElement;
    // Only attempt to sync if a track is playing, transcription is shown, transcriptionResult is available, and there's a media element.
    if (currentTrack?.id && showTranscription && transcriptionResult && media && isPlaying) {
      // console.log(`Syncing transcription for ${currentTrack.id} at ${progress.toFixed(2)}s`);
      updateCurrentTranscriptionSync(currentTrack.id, progress);
    }
  }, [progress, currentTrack?.id, showTranscription, transcriptionResult, isPlaying]); // Depend on progress to trigger sync updates


  return (
    <Box className="flex justify-start items-center flex-col"> { /* Fixed height for consistency, removed sticky for parent control */ }
      {/* Transcription Highlights (conditionally rendered at the top) */}
      {showTranscription && (
        <Paper
          elevation={6}
          sx={transcriptionPanelSx}
        >
          {isTranscribing && (
            <Box className='flex justify-center items-center gap-2'>
              <CircularProgress size={20} />
            </Box>
          )}
          {transcriptionError && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {transcriptionError}
            </Alert>
          )}
          {currentTrack?.fileType !== FileType.AUDIO && (
            <Alert severity="info" sx={{ mb: 1 }}>
              Transcription is currently only supported for audio files.
            </Alert>
          )}
          {currentTrack?.fileType === FileType.AUDIO &&
            !transcriptionResult &&
            !isTranscribing && (
              <Button
                variant="contained"
                onClick={() =>
                  currentTrack?.id && transcribeCurrentAudio(currentTrack.id)
                }
                disabled={!currentTrack?.id || isTranscribing}
                sx={{ width: '100%' }}
              >
                Transcribe Audio
              </Button>
            )}

          {transcriptionResult && transcriptionSyncData ? (
            <TranscriptionHighlight
              syncData={transcriptionSyncData}
              currentTime={progress}
              fullTranscription={transcriptionResult} // Pass full transcription here
              onSeek={handleTranscriptionSeek}
            />
          ) : (currentTrack?.fileType === FileType.AUDIO && transcriptionResult && !isTranscribing) ? (
            <Alert severity="info">Transcription loaded, waiting for sync data. Play audio to see highlights.</Alert>
          ) : null}
        </Paper>
      )}

      {/* Only render an audio element within this container. Video is handled by VideoModal. */}
      {currentTrack?.fileType === FileType.AUDIO && currentTrack?.streamUrl ? (
        <audio
          ref={internalMediaElementRef}
          src={currentTrack.streamUrl}
          style={{ display: 'none' }}
          preload="metadata"
        />
      ) : null}

      <MediaPlayer
        mediaType={currentTrack?.fileType || FileType.AUDIO}
        mediaElementRef={internalMediaElementRef} // Still pass this, but MediaPlayer uses $mediaStore.get().mediaElement
      />
    </Box>
  );
};

export default MediaPlayerContainer;
