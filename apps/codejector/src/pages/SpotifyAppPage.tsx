import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, useTheme } from '@mui/material';
import SpotifySidebar from '@/pages/spotify/SpotifySidebar';
import SpotifyMainContent from '@/pages/spotify/SpotifyMainContent';
import MediaPlayerContainer from '@/components/media/MediaPlayerContainer';
import { useStore } from '@nanostores/react';
import VideoModal from '@/components/VideoModal'; // Import VideoModal

import {
  isVideoModalOpenAtom,
  setIsVideoModalOpen,
  currentTrackAtom,
  isPlayingAtom,
  resetPlaybackState,
  setMediaElement,
  setPlaying,
  setError,
} from '@/stores/mediaStore';
import { FileType } from '@/types/refactored/media'; // Ensure FileType is imported from the correct path

type SpotifyView = 'home' | 'search' | 'library' | 'settings';

interface SpotifyAppPageProps {
  // No longer needs media refs as MediaPlayerContainer manages them internally
}

const SpotifyAppPage: React.FC<SpotifyAppPageProps> = () => {
  const theme = useTheme();
  const [currentView, setCurrentView] = useState<SpotifyView>('home');

  // Use individual atoms for frequently updated or persistent states
  const currentTrack = useStore(currentTrackAtom);
  const isPlaying = useStore(isPlayingAtom);
  const isVideoModalOpen = useStore(isVideoModalOpenAtom);

  // This ref is only for *potential* video modal element, not the main audio/video
  const videoModalMediaElementRef = useRef<HTMLVideoElement | null>(null);

  // Callback for when the native HTML5 video element is ready (from VideoModal's VideoPlayer)
  const handleMediaElementReady = useCallback(
    (htmlMediaElement: HTMLVideoElement) => {
      videoModalMediaElementRef.current = htmlMediaElement;
      setMediaElement(htmlMediaElement); // Register this element with the global store

      // If store says it should be playing, attempt to play
      if (isPlaying && htmlMediaElement) {
        htmlMediaElement.play().catch((e) => {
          console.error('HTML5 video playback failed on ready (modal):', e);
          setError('Video playback prevented. User interaction required.');
          setPlaying(false); // Update store
        });
      }
    },
    [isPlaying, setMediaElement, setError, setPlaying],
  );

  // Callback to handle closing the video modal
  const handleVideoModalClose = useCallback(() => {
    const media = videoModalMediaElementRef.current;
    if (media) {
      media.pause(); // Pause video when modal closes
    }
    setIsVideoModalOpen(false);
    resetPlaybackState(); // New: Reset all playback related state
    setMediaElement(null); // Clear the media element from the store when modal closes
  }, [setIsVideoModalOpen, resetPlaybackState, setMediaElement]);

  // Ensure media element is cleared from store if component unmounts unexpectedly (e.g. navigation)
  useEffect(() => {
    return () => {
      setMediaElement(null);
    };
  }, []);

  return (
    <>
      <Box
        sx={{
          // Outer container, the parent.
          display: 'grid',
          gridTemplateAreas: `'sidebar main'
                          'player player'`,
          gridTemplateColumns: '250px 1fr',
          gridTemplateRows: '1fr auto',
          flexGrow: 1,
          bgcolor: theme.palette.background.default,
          color: theme.palette.text.primary,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <SpotifySidebar
          currentView={currentView}
          onSelectView={setCurrentView}
        />

        <Box
          sx={{
            gridArea: 'main',
            bgcolor: theme.palette.background.default,
            overflowY: 'auto',
          }}
        >
          <SpotifyMainContent currentView={currentView} />
        </Box>
      </Box>

      {/* Integrate VideoModal to use currentTrack and handleMediaElementReady/Close */}
      {isVideoModalOpen &&
        currentTrack?.fileType === FileType.VIDEO &&
        currentTrack?.streamUrl && (
          <VideoModal
            open={isVideoModalOpen}
            onClose={handleVideoModalClose}
            src={currentTrack.streamUrl}
            mediaElementRef={
              videoModalMediaElementRef as React.MutableRefObject<HTMLVideoElement | null>
            }
            onPlayerReady={handleMediaElementReady}
            mediaType="video"
            size="fullscreen"
          />
        )}
    </>
  );
};

// Define MediaError enum if it's not already defined
const MediaError = {
  MEDIA_ERR_ABORTED: 1,
  MEDIA_ERR_NETWORK: 2,
  MEDIA_ERR_DECODE: 3,
  MEDIA_ERR_SRC_NOT_SUPPORTED: 4,
};

export default SpotifyAppPage;
