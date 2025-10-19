/**
 * @file Main component for the chat application, handling global state and layout.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, useTheme, CircularProgress, Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import { useStore } from '@nanostores/react';
import { authStore, user, getToken } from '@/stores/authStore';
import { activeConversationId, setActiveConversationId } from '@/stores/conversationStore';

import { chatSocketService } from './chatSocketService';
import { Message, SendMessageDto } from './types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import VideoChatComponent from './VideoChatComponent';
import { conversationApi } from '@/api/conversation'; // Import the new API service

// Bot User ID (remains constant)
const BOT_USER_ID = 'user-bot';

/**
 * Main component for the chat application, handling global state and layout.
 * Ensures user authentication status is loaded and reflects the current user.
 */
const ChatApp: React.FC = () => {
  const $auth = useStore(authStore);
  const $user = useStore(user);
  const $activeConversationId = useStore(activeConversationId);
  const theme = useTheme();

  const currentUserActualId = $user?.id || 'guest-user';

  const [messages, setMessages] = useState<Message[]>(
    []
  ); // messages now fully managed here, including history
  const [showVideoChat, setShowVideoChat] = useState(false);
  const [videoChatRoomId] = useState(() => crypto.randomUUID()); // Use UUID for video room ID
  const [conversationLoading, setConversationLoading] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true); // New state for history loading
  const [historyError, setHistoryError] = useState<string | null>(null); // New state for history error

  // Effect to create or retrieve a conversation ID on component mount
  useEffect(() => {
    const initializeConversation = async () => {
      if ($auth.isLoggedIn && $user?.id && !$activeConversationId) {
        setConversationLoading(true);
        setConversationError(null);
        try {
          const token = getToken();
          if (!token) {
            throw new Error('Authentication token not available.');
          }
          // Create a new conversation on the backend
          const newConversation = await conversationApi.createConversation({
            title: `Chat Session - ${new Date().toLocaleString()}`,
            createdById: $user.id,
          }, token);
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
  }, [$auth.isLoggedIn, $user?.id, $activeConversationId]);

  // Callback to handle incoming messages from WebSocket (for both new messages and history)
  const handleReceiveMessage = useCallback((receivedMessage: Message) => {
    setMessages((prev) => {
      // Prevent duplicates if the server echoes the sender's message
      if (prev.some(msg => msg.id === receivedMessage.id)) {
        return prev;
      }
      return [...prev, receivedMessage];
    });
  }, []);

  // Effect to connect/disconnect chat socket and listen for messages and history
  useEffect(() => {
    if ($auth.isLoggedIn && $user?.id && $activeConversationId) {
      setIsHistoryLoading(true);
      setHistoryError(null);

      chatSocketService.connect($auth.token)
        .then(() => {
          console.log('Chat socket connected for messages.');
          // Listen for incoming chat messages
          chatSocketService.on('receive_message', handleReceiveMessage);

          // Listen for conversation history once and populate messages
          chatSocketService.on('conversation_history', (history: Message[]) => {
            console.log('Conversation history received:', history);
            setMessages(history);
            setIsHistoryLoading(false);

            // Add initial bot welcome message if history is empty
            if (history.length === 0) {
              setMessages(prev => [
                ...prev,
                {
                  id: '0',
                  userId: BOT_USER_ID,
                  text: 'Hello! I am your friendly AI chat assistant. What can I help you with today?',
                  timestamp: new Date(),
                },
              ]);
            }
            chatSocketService.off('conversation_history'); // Remove listener after receiving history
          });

          // Request history after connecting
          chatSocketService.getHistory({ conversationId: $activeConversationId });
        })
        .catch(err => {
          console.error('Failed to connect chat socket or fetch history:', err);
          setHistoryError(err instanceof Error ? err.message : 'Failed to connect or load history.');
          setIsHistoryLoading(false);
        });
    }

    return () => {
      chatSocketService.off('receive_message');
      chatSocketService.off('conversation_history');
      chatSocketService.disconnect();
      console.log('Chat socket disconnected.');
    };
  }, [$auth.isLoggedIn, $auth.token, $user?.id, $activeConversationId, handleReceiveMessage]);

  const handleSendMessage = (text: string, userId: string = currentUserActualId) => {
    if (!$activeConversationId) {
      console.warn('Cannot send message: No active conversation ID.');
      setConversationError('No active conversation. Please wait or try again.');
      return;
    }

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
        conversationId: $activeConversationId, // Use the backend-provided conversation ID
        userId, // Matches the updated SendMessageDto type
        content: newMessage.text,
        sender: 'USER'
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

  // Show loading indicator while authentication status, conversation, or history is being determined
  if ($auth.loading || conversationLoading || isHistoryLoading) {
    return (
      <Box className="flex items-center justify-center h-full">
        <CircularProgress />
        <Typography variant="h6" ml={2}>
          {isHistoryLoading ? 'Loading conversation history...' : (conversationLoading ? 'Starting conversation...' : 'Loading user data...')}
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
  if ($auth.error || conversationError || historyError) {
    return (
      <Box className="flex items-center justify-center h-full p-4">
        <Typography variant="h6" color="error">
          Error: {$auth.error || conversationError || historyError}
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
