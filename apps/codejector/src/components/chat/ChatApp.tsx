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
  setHistoryError,
} from '@/components/chat/stores/conversationStore';
import { motion, AnimatePresence } from 'framer-motion';

import { authStore, user, getToken } from '@/stores/authStore';
import { chatSocketService } from './chatSocketService';
import { Message, SendMessageDto, Sender } from './types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import VideoChatComponent from './VideoChatComponent';
import { chatApi } from '@/components/chat/api/chat';

// Bot User ID (remains constant for client-side display)
const BOT_USER_ID = 'user-bot';

/**
 * Styles for the chat header box.
 * @param theme The Material UI theme object.
 */
const headerSx = (theme: any) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
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
  // NEW: Consume loading and error states from nanostore
  const $conversationLoading = useStore(conversationLoading);
  const $conversationError = useStore(conversationError);
  const $isHistoryLoading = useStore(isHistoryLoading);
  const $historyError = useStore(historyError);

  const theme = useTheme();
  const token = getToken();
  const currentUserActualId = $user?.id || 'guest-user';

  // Effect to create or retrieve a conversation ID on component mount
  useEffect(() => {
    const initializeConversation = async () => {
      // Only initialize if logged in, user ID is available, and no active conversation is set
      if ($auth.isLoggedIn && $user?.id && !$activeConversationId) {
        setConversationLoading(true); // Use nanostore setter
        setConversationError(null); // Use nanostore setter
        try {
          if (!token) {
            throw new Error('Authentication token not available.');
          }
          // Create a new conversation on the backend using the refactored chatApi
          const newConversation = await chatApi.createConversation(
            {
              title: `Chat Session - ${new Date().toLocaleString()}`,
              createdById: $user.id,
            },
          );
          setActiveConversationId(newConversation.id);
          console.log('New conversation created:', newConversation.id);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation.';
          setConversationError(errorMessage); // Use nanostore setter
          console.error('Error creating conversation:', err);
        } finally {
          setConversationLoading(false); // Use nanostore setter
        }
      }
    };

    initializeConversation();
  }, [$auth.isLoggedIn, $user?.id, $activeConversationId, token]);

  // Callback to handle incoming messages from WebSocket (for both new messages and history)
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
    if ($auth.isLoggedIn && $user?.id && $activeConversationId) {
      setIsHistoryLoading(true); // Use nanostore setter
      setHistoryError(null); // Use nanostore setter

      // Attempt to connect to the chat socket
      chatSocketService.connect(token)
        .then(() => {
          console.log('Chat socket connected for messages.');
          // Listen for incoming chat messages
          chatSocketService.on('receive_message', handleReceiveMessage);

          // Listen for conversation history once and populate messages
          chatSocketService.on('conversation_history', (history: Message[]) => {
            console.log('Conversation history received:', history);
            setMessages(history); // Use nanostore setter
            setIsHistoryLoading(false); // Use nanostore setter

            // Add initial bot welcome message if history is empty
            if (history.length === 0) {
              // We use onSendMessage here so that this initial bot message is also persisted.
              // The handleSendMessage logic will ensure it's marked as 'BOT' but uses the actual user's ID for persistence.
              handleSendMessage(
                'Hello! I am your friendly AI chat assistant. What can I help you with today?',
                BOT_USER_ID,
              );
            }
            chatSocketService.off('conversation_history'); // Remove listener after receiving history
          });

          // Request history after connecting
          chatSocketService.getHistory({ conversationId: $activeConversationId });
        })
        .catch(err => {
          console.error('Failed to connect chat socket or fetch history:', err);
          setHistoryError(err instanceof Error ? err.message : 'Failed to connect or load history.'); // Use nanostore setter
          setIsHistoryLoading(false); // Use nanostore setter
        });
    }

    // IMPORTANT: Remove chatSocketService.disconnect() from here.
    // The chat socket should remain connected as long as the ChatApp is mounted and active conversation exists,
    // regardless of video chat state. Its lifecycle is tied to ChatApp, not VideoChatComponent.
    return () => {
      chatSocketService.off('receive_message');
      chatSocketService.off('conversation_history');
      // chatSocketService.disconnect(); // REMOVED: This was causing disconnection when video chat was exited.
      // console.log('Chat socket disconnected.'); // REMOVED
    };
  }, [$auth.isLoggedIn, token, $user?.id, $activeConversationId, handleReceiveMessage]);

  /**
   * Handles sending a message, either from the user or the simulated bot.
   * Messages are first added to local state for immediate display.
   * Then, if connected, they are sent to the backend via WebSocket for persistence.
   * Bot messages use the actual user's ID for backend persistence but are marked with sender: 'BOT'.
   */
  const handleSendMessage = (text: string, userId: string = currentUserActualId) => {
    if (!$activeConversationId) {
      console.warn('Cannot send message: No active conversation ID.');
      setConversationError('No active conversation. Please wait or try again.'); // Use nanostore setter
      return;
    }

    // Determine the sender type for local display
    let localSenderType: Sender;
    if (userId === BOT_USER_ID) {
      localSenderType = Sender.BOT;
    } else {
      localSenderType = Sender.USER;
    }

    const newMessage: Message = {
      id: crypto.randomUUID(), // Ensure message has a unique ID for deduplication
      userId: userId, // This is the identifier for local display, can be 'user-bot' or actual user ID
      content: text, // Use 'content' as per interface
      createdAt: new Date(),
      sender: localSenderType, // Set sender type for local message
    };

    // Always add message to local state first for immediate display
    // This is now handled by the `receive_message` listener that adds messages received from the server.
    // For user-sent messages, they will be echoed by the server. For bot messages, they are also sent via websocket.
    // The duplicate check in handleReceiveMessage will prevent adding the message twice.
    // So, we don't need to manually set the message here for immediate display.
    // If we wanted instant display before server echo, we'd add `setMessages((prev) => [...prev, newMessage]);` here.
    // Keeping it commented out for now as the current duplicate prevention logic in handleReceiveMessage handles it.

    // Determine the actual userId to send to backend and the sender type for persistence
    const backendUserId = currentUserActualId; // Use the authenticated user's ID for persistence
    let senderTypeForBackend: Sender;

    if (userId === BOT_USER_ID) {
      senderTypeForBackend = Sender.BOT; // This message originated from the bot logic
    } else {
      senderTypeForBackend = Sender.USER; // This message originated from the actual user
    }

    // Only send via WebSocket if connected
    if (chatSocketService.isConnected()) {
      const sendMessageDto: SendMessageDto = {
        conversationId: $activeConversationId,
        userId: backendUserId,
        content: newMessage.content,
        sender: senderTypeForBackend,
      };
      chatSocketService.sendMessage(sendMessageDto);
      console.log('Message sent via WebSocket:', sendMessageDto);
    } else {
      console.warn('Chat socket not connected, message not sent to backend.');
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
        backgroundColor: theme.palette.background.default,
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
            <MessageList messages={$messages} currentUserId={currentUserActualId} />

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
