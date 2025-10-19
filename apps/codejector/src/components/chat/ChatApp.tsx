/**
 * @file Main component for the chat application, handling global state and layout.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, useTheme, CircularProgress, Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import { useStore } from '@nanostores/react';
import { authStore, user } from '@/stores/authStore';
import { nanoid } from 'nanoid';

import { chatSocketService } from './chatSocketService';
import { Message, SendMessageDto } from './types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import VideoChatComponent from './VideoChatComponent';

// Bot User ID (remains constant)
const BOT_USER_ID = 'user-bot';

/**
 * Main component for the chat application, handling global state and layout.
 * Ensures user authentication status is loaded and reflects the current user.
 */
const ChatApp: React.FC = () => {
  const $auth = useStore(authStore);
  const $user = useStore(user);
  const theme = useTheme();


  const currentUserActualId = $user?.id || 'guest-user';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      userId: BOT_USER_ID,
      text: 'Hello! I am your friendly AI chat assistant. What can I help you with today?',
      timestamp: new Date(),
    },
  ]);
  const [showVideoChat, setShowVideoChat] = useState(false);
  // Generate a fixed roomId for the lifetime of this ChatApp component
  // In a real app, this might come from a conversation ID or be user-defined.
  const [videoChatRoomId] = useState(() => nanoid(10));
  const [conversationId] = useState<string>(() => nanoid(10)); // Unique ID for this chat session

  // Callback to handle incoming messages from WebSocket
  const handleReceiveMessage = useCallback((receivedMessage: Message) => {
    setMessages((prev) => {
      // Prevent duplicates if the server echoes the sender's message
      if (prev.some(msg => msg.id === receivedMessage.id)) {
        return prev;
      }
      return [...prev, receivedMessage];
    });
  }, []);

  // Effect to connect/disconnect chat socket and listen for messages
  useEffect(() => {
    if ($auth.isLoggedIn && $user?.id) {
      chatSocketService.connect($auth.token)
        .then(() => {
          console.log('Chat socket connected for messages.');
          // Listen for incoming chat messages
          chatSocketService.on('receive_message', handleReceiveMessage);
          // Optionally request history here, e.g., on initial connection or when conversationId changes:
          // chatSocketService.getHistory({ conversationId: conversationId });
        })
        .catch(err => console.error('Failed to connect chat socket:', err));
    }

    return () => {
      chatSocketService.off('receive_message');
      chatSocketService.disconnect();
      console.log('Chat socket disconnected.');
    };
  }, [$auth.isLoggedIn, $auth.token, $user?.id, conversationId, handleReceiveMessage]);

  const handleSendMessage = (text: string, userId: string = currentUserActualId) => {
    const newMessage: Message = {
      id: crypto.randomUUID(), // Ensure message has a unique ID for deduplication
      userId,
      text,
      timestamp: new Date(),
    };

    // Always add message to local state first for immediate display
    setMessages((prev) => [...prev, newMessage]);

    // If it's the actual user sending the message, also send via WebSocket
    if (userId === currentUserActualId && chatSocketService.isConnected()) {
      const sendMessageDto: SendMessageDto = {
        conversationId: conversationId, // Use the unique conversation ID for this session
        senderId: userId,
        text: newMessage.text,
      };
      chatSocketService.sendMessage(sendMessageDto);
      console.log('Message sent via WebSocket:', sendMessageDto);
    }
    // Note: If userId is BOT_USER_ID, it's a client-side simulated message
    // and should not be re-sent to the server via WebSocket unless intended.
  };

  const toggleVideoChat = () => {
    setShowVideoChat(prev => !prev);
  };

  // Show loading indicator while authentication status is being determined
  if ($auth.loading) {
    return (
      <Box className="flex items-center justify-center h-full">
        <CircularProgress />
        <Typography variant="h6" ml={2}>Loading user data...</Typography>
      </Box>
    );
  }

  // If not logged in after the check, display an appropriate message.
  // Depending on requirements, this might redirect to a login page instead.
  if (!$auth.isLoggedIn && !$auth.loading && !$auth.user) {
    return (
      <Box className="flex flex-col items-center justify-center h-full p-4">
        <Typography variant="h6" color="textSecondary">
          Please log in to use the chat application.
        </Typography>
        {/* You might add a login button or link here */}
      </Box>
    );
  }

  // Display authentication error if one exists
  if ($auth.error) {
    return (
      <Box className="flex items-center justify-center h-full p-4">
        <Typography variant="h6" color="error">Authentication Error: {$auth.error}</Typography>
      </Box>
    );
  }

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
          className="p-4 shadow-lg flex justify-between items-center"
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
          }}
        >
          <div>
            <Typography variant="h5" component="h1" className="font-bold">
              Gemini AI Chat
            </Typography>
            <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
              Current User: {$user?.name || 'Guest User'} {(!$user?.id && '(Guest Mode)') || ''}
            </Typography>
          </div>
          <Button
            variant="contained"
            color="secondary"
            onClick={toggleVideoChat}
            startIcon={showVideoChat ? <VideocamOffIcon /> : <VideocamIcon />}
            sx={{ ml: 2 }}
          >
            {showVideoChat ? 'Exit Video' : 'Join Video'}
          </Button>
        </Box>

        {showVideoChat ? (
          <VideoChatComponent roomId={videoChatRoomId} onClose={() => setShowVideoChat(false)} />
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
