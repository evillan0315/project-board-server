/**
 * @file Main component for the video chat application, orchestrating WebRTC and UI.
 */

import React, { useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, useTheme } from '@mui/material';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import { useWebRTC } from './useWebRTC';
import VideoFeed from './VideoFeed';
import VideoControls from './VideoControls';
import { VideoChatComponentProps } from './types';

/**
 * The main component for the video chat. It manages the WebRTC lifecycle,
 * displays local and remote video feeds, and provides call controls.
 */
const VideoChatComponent: React.FC<VideoChatComponentProps> = ({ roomId, onClose }) => {
  const $auth = useStore(authStore);
  const theme = useTheme();

  const currentUserId = $auth.user?.id;
  const authToken = $auth.token;

  const { 
    localStream, 
    remoteStreams, 
    isAudioMuted, 
    isVideoMuted, 
    error, 
    isLoading, 
    connect, 
    disconnect, 
    toggleAudio, 
    toggleVideo 
  } = useWebRTC(currentUserId || 'unknown-user'); // Fallback for userId

  useEffect(() => {
    if (roomId && currentUserId && authToken) {
      connect(roomId, authToken);
    } else if (!authToken) {
      // This case should ideally be handled by a route guard or higher-level auth check
      // For robustness, ensure we disconnect if token disappears during a call.
      disconnect();
    }
    // Disconnect on component unmount
    return () => {
      disconnect();
    };
  }, [roomId, currentUserId, authToken, connect, disconnect]);

  const handleHangUp = () => {
    disconnect();
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
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
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
      className="flex flex-col h-full overflow-hidden"
      sx={{ backgroundColor: theme.palette.background.default }}
    >
      <Paper elevation={3} className="flex flex-col h-full rounded-b-xl overflow-hidden shadow-2xl">
        {/* Video Feeds Area */}
        <Box 
          className={`flex-grow grid grid-cols-1 md:grid-cols-2 ${gridColsClass} gap-4 p-4 overflow-y-auto`}
          sx={{ backgroundColor: theme.palette.background.default }}
        >
          {localStream && (
            <VideoFeed key="local-feed" stream={localStream} muted={true} isLocal={true} peerId={currentUserId} />
          )}
          {remoteStreams.map((peer) => (
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
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onHangUp={handleHangUp}
        />
      </Paper>
    </Box>
  );
};

export default VideoChatComponent;
