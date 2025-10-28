import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  Card,
  CardContent,
  Divider,
  Button,
} from '@mui/material'; // Added Button for test message
import { useStore } from '@nanostores/react';
import { useParams } from 'react-router-dom';

import { openViduStore } from '@/components/swingers/stores/openViduStore';
import { connectionStore } from '@/components/swingers/stores/connectionStore'; // Import connectionStore
import { useOpenViduSession } from '@/components/swingers/hooks/useOpenViduSession';
import { OpenViduSessionForm } from '@/components/swingers/openvidu/OpenViduSessionForm';
import { OpenViduControls } from '@/components/swingers/openvidu/OpenViduControls';
import { OpenViduVideoGrid } from '@/components/swingers/openvidu/OpenViduVideoGrid';

// --- Styles ---
const containerSx = {
  padding: '24px',
  '@media (max-width: 600px)': {
    padding: '16px',
  },
};

const titleSx = {
  marginBottom: '24px',
  fontWeight: 700,
  textAlign: 'center',
};

const alertSx = {
  marginBottom: '16px',
};

const OpenViduPage: React.FC = () => {
  const ovState = useStore(openViduStore);
  const { connections } = useStore(connectionStore); // Access connections from connectionStore
  const { roomId } = useParams<{ roomId: string }>(); // Get roomId from URL parameters

  const {
    sessionNameInput,
    handleSessionNameChange,
    joinSession,
    leaveSession,
    toggleCamera,
    toggleMic,
    isCameraActive,
    isMicActive,
    isLoading,
    error,
    sendChatMessage,
  } = useOpenViduSession(roomId); // Pass roomId to the hook

  // Effect to automatically join session if roomId is present in URL and not already connected
  useEffect(() => {
    if (roomId && ovState.currentSessionId !== roomId && !isLoading) {
      joinSession(roomId);
    }
  }, [roomId, ovState.currentSessionId, isLoading, joinSession]);

  // Example of how to use sendChatMessage (e.g., in response to a button click)
  const handleSendTestMessage = () => {
    if (sendChatMessage) {
      sendChatMessage('Hello from OpenViduPage!');
    }
  };

  return (
    <Box
      sx={containerSx}
      className="w-full flex flex-col items-center py-4 h-full"
    >
      <Typography
        variant="h4"
        component="h1"
        sx={titleSx}
        className="text-3xl md:text-4xl text-purple-600 dark:text-purple-400"
      >
        OpenVidu Session Connector
      </Typography>

      <Box className="max-w-3xl w-full">
        {error && (
          <Alert severity="error" sx={alertSx} className="max-w-3xl w-full">
            {error}
          </Alert>
        )}

        <OpenViduSessionForm
          sessionNameInput={sessionNameInput}
          handleSessionNameChange={handleSessionNameChange}
          joinSession={joinSession}
          leaveSession={leaveSession}
          isLoading={isLoading}
          currentSessionId={ovState.currentSessionId}
          error={error}
          isRoomIdFromUrl={!!roomId}
        />

        {ovState.currentSessionId && (
          <Card className="mb-4 max-w-3xl w-full">
            <CardContent>
              <Typography variant="h6" className="mb-2 font-semibold">
                Active Session: {ovState.currentSessionId}
              </Typography>
              <Typography
                variant="body2"
                className="mb-2 text-gray-500 dark:text-gray-400"
              >
                Participants: {connections.length}
              </Typography>
              <Divider className="mb-2" />
              <OpenViduControls
                isCameraActive={isCameraActive}
                toggleCamera={toggleCamera}
                isMicActive={isMicActive}
                toggleMic={toggleMic}
                publisher={ovState.publisher}
              />
              <Button
                onClick={handleSendTestMessage}
                variant="outlined"
                className="mt-4"
              >
                Send Test Chat Message
              </Button>
            </CardContent>
          </Card>
        )}

        <OpenViduVideoGrid
          publisher={ovState.publisher}
          subscribers={ovState.subscribers}
        />

        {!ovState.currentSessionId && !isLoading && !error && (
          <Alert severity="info" className="max-w-3xl w-full mt-4">
            Enter a session name to start or join an OpenVidu video call.
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default OpenViduPage;
