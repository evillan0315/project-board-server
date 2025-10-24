/**
 * @file Main component for the video chat application, orchestrating WebRTC and UI.
 */

import React, { useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, useTheme } from '@mui/material';
import { useStore } from '@nanostores/react';
import { authStore, user, getToken } from '@/stores/authStore';
import { webRtcStore } from '@/components/chat/stores/webRtcStore'; // Import the new Nanostore
import VideoFeed from './VideoFeed';
import VideoControls from './VideoControls';
import { VideoChatComponentProps } from './types';

/**
 * The main component for the video chat. It manages the WebRTC lifecycle,
 * displays local and remote video feeds, and provides call controls.
 */
export default function VideoChatComponent({ roomId, onClose }: VideoChatComponentProps) {
  const $user = useStore(user);
  const theme = useTheme();

  const currentUserId = $user?.id; // This is the database user ID
  const authToken = getToken();

  // Consume WebRTC state from the Nanostore
  const localStream = useStore(webRtcStore.localStream);
  const remoteStreams = useStore(webRtcStore.remoteStreams);
  const isAudioMuted = useStore(webRtcStore.isAudioMuted);
  const isVideoMuted = useStore(webRtcStore.isVideoMuted);
  const error = useStore(webRtcStore.error);
  const isLoading = useStore(webRtcStore.isLoading);

  useEffect(() => {
    if (roomId && currentUserId && authToken) {
      webRtcStore.connect(roomId, authToken, currentUserId); // Call connect method from the store with DB userId
    } else if (!authToken) {
      webRtcStore.disconnect(); // Disconnect if token disappears
    }
    // Disconnect on component unmount
    return () => {
      webRtcStore.disconnect(); // Call disconnect method from the store
    };
  }, [roomId, currentUserId, authToken]);

  const handleHangUp = () => {
    webRtcStore.disconnect(); // Call disconnect method from the store
    if (onClose) {
      onClose();
    }
  };

  if (isLoading) {
    return (
      <Box className="flex flex-col items-center justify-center h-full p-4">
        <CircularProgress />
        <Typography variant="h6" mt={2}>Connecting to video chat...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="flex flex-col items-center justify-center h-full p-4">
        <Alert severity="error">Error: {error}</Alert>
        <VideoControls
          isAudioMuted={isAudioMuted}
          isVideoMuted={isVideoMuted}
          onToggleAudio={webRtcStore.toggleAudio}
          onToggleVideo={webRtcStore.toggleVideo}
          onHangUp={handleHangUp}
        />
      </Box>
    );
  }

  // Determine grid columns based on number of participants
  const numParticipants = (localStream ? 1 : 0) + remoteStreams.length;
  const gridColsClass = numParticipants > 2 ? 'lg:grid-cols-3' : (numParticipants === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-1');

  return (
    <Box
      className="flex flex-col h-full"
      sx={{ backgroundColor: theme.palette.background.default }} // Fill the background of the video chat panel
    >
      {/* Video Feeds Area */}
      <Box
        className={`flex-grow grid grid-cols-1 md:grid-cols-2 ${gridColsClass} gap-4 p-4 overflow-y-auto justify-center items-center`}
        sx={{ backgroundColor: theme.palette.background.default }} // Keep this for the video grid background
      >
        {localStream && (
          <VideoFeed key="local-feed" stream={localStream} muted={true} isLocal={true} peerId={currentUserId} />
        )}
        {remoteStreams.map((peer) => (
          // peer.peerId is the socketId of the remote peer
          <VideoFeed key={peer.peerId} stream={peer.stream} peerId={peer.peerId} />
        ))}

        {!localStream && remoteStreams.length === 0 && !isLoading && !error && (
          <Box className="col-span-full flex items-center justify-center h-full text-gray-500">
            <Typography variant="h6" color="textSecondary">
              No active video participants. Waiting for others...
            </Typography>
          </Box>
        )}
      </Box>

      {/* Controls */}
      <VideoControls
        isAudioMuted={isAudioMuted}
        isVideoMuted={isVideoMuted}
        onToggleAudio={webRtcStore.toggleAudio}
        onToggleVideo={webRtcStore.toggleVideo}
        onHangUp={handleHangUp}
      />
    </Box>
  );
}
