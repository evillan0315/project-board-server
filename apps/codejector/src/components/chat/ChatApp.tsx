/**
 * @file Main component for the chat application, handling global state and layout.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, useTheme, CircularProgress, Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import { useStore } from '@nanostores/react';
import {
  activeConversationId,
  setActiveConversationId,
  showVideoChat,
  setShowVideoChat,
  messages,
  setMessages,
  conversationLoading,
  setConversationLoading,
  conversationError,
  setConversationError,
  isHistoryLoading,
  setIsHistoryLoading,
  historyError,
  setHistoryError
} from '@/components/chat/stores/conversationStore';
import { motion, AnimatePresence } from 'framer-motion';

import { authStore, user, getToken } from '@/stores/authStore';
import { chatSocketService } from './chatSocketService';
import { Message, SendMessageDto, Sender } from './types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import VideoChatComponent from './VideoChatComponent';
import { chatApi } from '@/components/chat/api/chat';

// Bot User ID (used for distinguishing bot messages, but backend `createdById` will still be actual user's ID)
const BOT_DISPLAY_ID = 'user-bot-display-id';

/**
 * Styles for the chat header box.
 * @param theme The Material UI theme object.
 */
const headerSx = (theme: any) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText
});

/**
 * Main component for the chat application, handling global state and layout.
 * Ensures user authentication status is loaded and reflects the current user.
 */
const ChatApp: React.FC = () => {
  const $auth = useStore(authStore);
  const $user = useStore(user);
  const $activeConversationId = useStore(activeConversationId);
  const $showVideoChat = useStore(showVideoChat);
  const $messages = useStore(messages);
  const $conversationLoading = useStore(conversationLoading);
  const $conversationError = useStore(conversationError);
  const $isHistoryLoading = useStore(isHistoryLoading);
  const $historyError = useStore(historyError);

  const theme = useTheme();
  const token = getToken();
  const currentUserDbId = $user?.id || 'guest-user'; // This is the actual database user ID

  // Effect to create or retrieve a conversation ID on component mount
  useEffect(() => {
    const initializeConversation = async () => {
      // Only initialize if logged in, user ID is available, and no active conversation is set
      if ($auth.isLoggedIn && $user?.id && !$activeConversationId) {
        setConversationLoading(true);
        setConversationError(null);
        try {
          if (!token) {
            throw new Error('Authentication token not available.');
          }
          // Create a new conversation on the backend using the refactored chatApi
          const newConversation = await chatApi.createConversation({
            title: `Chat Session - ${new Date().toLocaleString()}`,
            createdById: $user.id
          });
          setActiveConversationId(newConversation.id);
          console.log('New conversation created:', newConversation.id);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation.';
          setConversationError(errorMessage);
          console.error('Error creating conversation:', err);
        } finally {
          setConversationLoading(false);
        }
      }
    };

    initializeConversation();
  }, [$auth.isLoggedIn, $user?.id, $activeConversationId, token]);

  // Callback to handle incoming messages from WebSocket
  const handleReceiveMessage = useCallback((receivedMessage: Message) => {
    setMessages((prev) => {
      // Prevent duplicates if the server echoes the sender's message (by comparing unique IDs)
      if (prev.some((msg) => msg.id === receivedMessage.id)) {
        return prev;
      }
      return [...prev, receivedMessage];
    });
  }, []);

  // Effect to connect/disconnect chat socket and listen for messages and history
  useEffect(() => {
    // Connect chat socket and fetch history when authenticated and conversation ID is ready
    if ($auth.isLoggedIn && currentUserDbId !== 'guest-user' && $activeConversationId) {
      setIsHistoryLoading(true);
      setHistoryError(null);

      chatSocketService.connect(token)
        .then(() => {
          console.log('Chat socket connected for messages.');
          chatSocketService.on('receive_message', handleReceiveMessage);
          chatSocketService.on('conversation_history', (history: Message[]) => {
            console.log('Conversation history received:', history);
            setMessages(history);
            setIsHistoryLoading(false);

            // Add initial bot welcome message if history is empty
            if (history.length === 0) {
              // Use the actual user's DB ID for persistence, but mark sender as BOT for display.
              handleSendMessage(
                'Hello! I am your friendly AI chat assistant. What can I help you with today?',
                BOT_DISPLAY_ID // This is a display-only ID
              );
            }
            chatSocketService.off('conversation_history'); // Remove listener after receiving history
          });

          chatSocketService.getHistory({ conversationId: $activeConversationId });
        })
        .catch(err => {
          console.error('Failed to connect chat socket or fetch history:', err);
          setHistoryError(err instanceof Error ? err.message : 'Failed to connect or load history.');
          setIsHistoryLoading(false);
        });

      return () => {
        // Only remove specific listeners here, do not disconnect the entire socket
        chatSocketService.off('receive_message');
        chatSocketService.off('conversation_history');
        // The chatSocketService connection should be managed higher up or on full component unmount.
      };
    }
    // If for some reason the component unmounts or user logs out, ensure socket is disconnected
    return () => {
      if (!($auth.isLoggedIn && currentUserDbId !== 'guest-user' && $activeConversationId)) {
         chatSocketService.disconnect();
      }
    }
  }, [$auth.isLoggedIn, token, currentUserDbId, $activeConversationId, handleReceiveMessage]);

  /**
   * Handles sending a message, either from the user or the simulated bot.
   * Messages are sent to the backend via WebSocket for persistence.
   * Bot messages use the actual user's DB ID for backend persistence but are marked with sender: 'BOT'.
   * @param text The content of the message.
   * @param createdBy An optional ID to indicate who initiated the message logic (e.g., BOT_DISPLAY_ID). 
   *                  The actual `createdById` for persistence will always be `currentUserDbId`.
   */
  const handleSendMessage = (text: string, createdBy: string = currentUserDbId) => {
    if (!$activeConversationId) {
      console.warn('Cannot send message: No active conversation ID.');
      setConversationError('No active conversation. Please wait or try again.');
      return;
    }

    // Determine the sender type for local display and backend persistence
    let senderType: Sender;
    if (createdBy === BOT_DISPLAY_ID) {
      senderType = Sender.BOT;
    } else {
      senderType = Sender.USER;
    }

    // The ID of the user that will be persisted in the database.
    // For bot messages, it's still the actual logged-in user who 'owns' the conversation.
    const actualCreatedByIdForBackend = currentUserDbId;

    // Only send via WebSocket if connected
    if (chatSocketService.isConnected()) {
      const sendMessageDto: SendMessageDto = {
        conversationId: $activeConversationId,
        userId: actualCreatedByIdForBackend, // Maps to Prisma's `createdById`
        content: text,
        sender: senderType,
      };
      chatSocketService.sendMessage(sendMessageDto);
      console.log('Message sent via WebSocket:', sendMessageDto);
    } else {
      console.warn('Chat socket not connected, message not sent to backend.');
      // Optionally, add a temporary local message for display even if not sent
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        conversationId: $activeConversationId,
        createdById: actualCreatedByIdForBackend,
        content: text,
        createdAt: new Date(),
        sender: senderType
      }]);
    }
  };

  const toggleVideoChat = () => {
    setShowVideoChat(!$showVideoChat);
  };

  // Show loading indicator while authentication status, conversation, or history is being determined
  if ($auth.loading || $conversationLoading || $isHistoryLoading) {
    return (
      <Box className="flex items-center justify-center h-full">
        <CircularProgress />
        <Typography variant="h6" ml={2}>
          {$isHistoryLoading ? 'Loading conversation history...' : ($conversationLoading ? 'Starting conversation...' : 'Loading user data...')}
        </Typography>
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

  // Display authentication, conversation creation, or history error if one exists
  if ($auth.error || $conversationError || $historyError) {
    return (
      <Box className="flex items-center justify-center h-full p-4">
        <Typography variant="h6" color="error">
          Error: {$auth.error || $conversationError || $historyError}
        </Typography>
      </Box>
    );
  }

  // If we reach here and still no active conversation ID, something went wrong
  if (!$activeConversationId) {
    return (
      <Box className="flex flex-col items-center justify-center h-full p-4">
        <Typography variant="h6" color="error">
          Failed to start chat. Please try refreshing.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      className="w-full max-w-7xl mx-auto h-[85vh] flex flex-col"
      sx={{
        fontFamily: 'Inter, sans-serif',
        backgroundColor: theme.palette.background.default
      }}
    >
      <Paper elevation={1} className="flex flex-col h-full rounded-xl overflow-hidden shadow-2xl">
        <Box
          className="p-4 shadow-lg flex justify-between items-center z-10"
          sx={headerSx(theme)}
        >
          <div>
            <Typography variant="h5" component="h1" className="font-bold">
              Chatbot
            </Typography>
          </div>
          <Button
            variant="contained"
            color="secondary"
            onClick={toggleVideoChat}
            startIcon={$showVideoChat ? <VideocamOffIcon /> : <VideocamIcon />}
            sx={{ ml: 2 }}
          >
            {$showVideoChat ? 'Exit Video' : 'Join Video'}
          </Button>
        </Box>

        {/* Content Area - where the animation happens */}
        <Box className="flex-grow flex overflow-hidden"> {/* Parent is now a flex container */}
          <motion.div
            key="chat-messages-container"
            initial={{ flexBasis: '100%' }}
            animate={{ flexBasis: $showVideoChat ? '50%' : '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col flex-grow overflow-hidden" // Chat messages take available space, handle overflow
          >
            {/* Message List Area */}
            <MessageList messages={$messages} currentUserId={currentUserDbId} />

            {/* Message Input Area */}
            <MessageInput onSendMessage={handleSendMessage} />
          </motion.div>

          <AnimatePresence>
            {$showVideoChat && $activeConversationId ? (
              <motion.div
                key="video-chat-container"
                initial={{ x: '100%' }} // Start off-screen to the right
                animate={{ x: 0 }} // Slide into view
                exit={{ x: '100%' }} // Slide out to the right
                transition={{ type: 'spring', stiffness: 300, damping: 30 }} // Smooth spring animation
                className="flex flex-col flex-shrink-0 w-1/2 overflow-hidden"
              >
                <VideoChatComponent roomId={$activeConversationId} onClose={() => setShowVideoChat(false)} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatApp;
