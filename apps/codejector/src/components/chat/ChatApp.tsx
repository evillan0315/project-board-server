/**
 * @file Main component for the chat application, handling global state and layout.
 */

import React, { useState } from 'react';
import { Box, Typography, Paper, useTheme, Button } from '@mui/material';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';

import { Message } from './types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import VideoChatComponent from './VideoChatComponent'; // Import the new video chat component

// Bot User ID (remains constant)
const BOT_USER_ID = 'user-bot';

/**
 * Main component for the chat application, handling global state and layout.
 */
const ChatApp: React.FC = () => {
  const $auth = useStore(authStore);
  const currentUserActualId = $auth.user?.id || 'guest-user'; // Use actual user ID or a guest fallback
  const theme = useTheme();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      userId: BOT_USER_ID,
      text: 'Hello! I am your friendly AI chat assistant. What can I help you with today?',
      timestamp: new Date(),
    },
  ]);
  const [isVideoChatActive, setIsVideoChatActive] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string>('default-chat-room'); // Use a fixed ID for now or create dynamically

  const handleSendMessage = (text: string, userId: string = currentUserActualId) => {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      userId,
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const toggleVideoChat = () => {
    setIsVideoChatActive((prev) => !prev);
  };

  const handleVideoChatClose = () => {
    setIsVideoChatActive(false);
  };

  return (
    <Box
      className="max-w-3xl mx-auto h-[90vh] flex flex-col p-4"
      sx={{
        fontFamily: 'Inter, sans-serif',
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Paper elevation={3} className="flex flex-col h-full rounded-xl overflow-hidden shadow-2xl">
        <Box
          className="p-4 shadow-lg flex items-center justify-between"
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
          }}
        >
          <Box>
            <Typography variant="h5" component="h1" className="font-bold">
              Gemini AI Chat
            </Typography>
            <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
              Current User: {$auth.user?.name || currentUserActualId} {(!$auth.user?.id && '(Guest Mode)') || ''}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color={isVideoChatActive ? 'error' : 'secondary'}
            onClick={toggleVideoChat}
            startIcon={isVideoChatActive ? <VideocamOffIcon /> : <VideocamIcon />}
            sx={{ ml: 2, borderRadius: '9999px' }}
          >
            {isVideoChatActive ? 'End Video' : 'Start Video'}
          </Button>
        </Box>

        {isVideoChatActive ? (
          <VideoChatComponent roomId={conversationId} onClose={handleVideoChatClose} />
        ) : (
          <>
            {/* Message List Area */}
            <MessageList messages={messages} currentUserId={currentUserActualId} />

            {/* Message Input Area */}
            <MessageInput onSendMessage={handleSendMessage} />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ChatApp;
