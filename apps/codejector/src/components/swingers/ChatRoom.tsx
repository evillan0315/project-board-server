import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  Paper,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';

import { chatStore, IChatMessage, setChatError, setChatLoading } from './stores/chatStore';
import { useOpenViduSession } from './hooks/useOpenViduSession';

// New sub-components
import { LiveStreamPanel } from './chatroom/LiveStreamPanel';
import { ChatHeader } from './chatroom/ChatHeader';
import { MessageList } from './chatroom/MessageList';
import { MessageInput } from './chatroom/MessageInput';

interface ChatRoomProps {
  roomId?: string;
}

// --- Styles --- //
const chatContainerSx = {
  height: '100%',
  border: '1px solid',
  borderColor: 'divider',
  backgroundColor: 'background.paper',
  boxShadow: 3,
};

export const ChatRoom: React.FC<ChatRoomProps> = ({ roomId }) => {
  const { messages, loading, error } = useStore(chatStore);
  const theme = useTheme();

  const {
    joinSession,
    leaveSession,
    initLocalMediaPreview,
    destroyLocalMediaPreview,
    toggleCamera,
    toggleMic,
    isCameraActive,
    isMicActive,
    isLoading: isOVSessionLoading,
    error: ovSessionError,
    publisher,
    subscribers,
    currentSessionId,
    openViduInstance,
    currentUserDisplayName,
    sendChatMessage,
  } = useOpenViduSession(roomId, 'PUBLISHER');

  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (roomId && openViduInstance && currentSessionId !== roomId) {
      joinSession(roomId);
    }
  }, [roomId, openViduInstance, currentSessionId, joinSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (error) {
      console.error('Chat Store Error:', error);
    }
    if (ovSessionError) {
      console.error('OpenVidu Session Error:', ovSessionError);
    }
  }, [error, ovSessionError]);

  const handleSendMessage = useCallback(async () => {
    if (messageInput.trim() === '') return;

    setChatLoading(true);
    setChatError(null);
    try {
      await sendChatMessage(messageInput);
      setMessageInput('');
    } catch (e: any) {
      setChatError(`Failed to send message: ${e.message || e}`);
    } finally {
      setChatLoading(false);
    }
  }, [messageInput, sendChatMessage]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const allErrors = error || ovSessionError;
  const overallLoading = loading || isOVSessionLoading;

  return (
    <Paper sx={chatContainerSx} className="flex items-center w-full rounded-none">
      <Box className="flex flex-col md:flex-row flex-1 overflow-auto ">
        {/* Live Stream content (Left, wider) */}
        <LiveStreamPanel
          overallErrors={allErrors}
          isOVSessionLoading={isOVSessionLoading}
          currentSessionId={currentSessionId}
          publisher={publisher}
          subscribers={subscribers}
          isCameraActive={isCameraActive}
          toggleCamera={toggleCamera}
          isMicActive={isMicActive}
          toggleMic={toggleMic}
          leaveSession={leaveSession}
        />

        {/* Chat Room content (Right, narrower) */}
        <Box className="flex flex-col flex-1 md:flex-1 border-t md:border-l md:border-t-0" sx={{ borderColor: 'divider' }}>
          <ChatHeader theme={theme} />

          <MessageList
            messages={messages}
            messagesEndRef={messagesEndRef}
            currentUserDisplayName={currentUserDisplayName}
            theme={theme}
          />

          <MessageInput
            messageInput={messageInput}
            setMessageInput={setMessageInput}
            handleSendMessage={handleSendMessage}
            handleKeyPress={handleKeyPress}
            overallLoading={overallLoading}
          />
        </Box>
      </Box>
    </Paper>
  );
};
