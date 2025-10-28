import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Avatar,
  useTheme,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CallEndIcon from '@mui/icons-material/CallEnd';
import { chatStore, IChatMessage, setChatError, setChatLoading, clearChat } from './stores/chatStore';
import { useOpenViduSession } from './hooks/useOpenViduSession';
import { OpenViduVideoGrid } from './openvidu/OpenViduVideoGrid';
import { OpenViduControls } from './openvidu/OpenViduControls';

interface ChatRoomProps {
  roomId?: string;
}

// --- Styles --- //
const chatContainerSx = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 0,
  backgroundColor: 'background.paper',
  boxShadow: 3,
};

const messageListSx = {
  flexGrow: 1,
  overflowY: 'auto',
  padding: '8px',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-thumb': {
    //backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-track': {
    //backgroundColor: 'transparent',
  },
};

const messageInputContainerSx = {
  padding: '16px',
  borderTop: '1px solid',
  borderColor: 'divider',
  backgroundColor: 'background.default',
};

const messageBubbleSx = (isLocal: boolean, type: string, theme: ReturnType<typeof useTheme>) => ({
  display: 'flex',
  justifyContent: isLocal ? 'flex-end' : type === 'whisper' ? 'flex-center' : 'flex-start',
  marginBottom: '8px',
  '& .MuiListItemText-root': {
    maxWidth: '75%',
  },
  '& .MuiListItemText-primary': {
    fontWeight: 'bold',
    marginBottom: '2px',
  },
  '& .MuiListItemText-secondary': {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    borderRadius: '16px',
    padding: '8px 12px',
    backgroundColor: isLocal
      ? theme.palette.background.default
      : type === 'whisper'
        ? theme.palette.warning.main
        : theme.palette.primary.dark,
    color: isLocal
      ? theme.palette.text.primary
      : type === 'whisper'
        ? theme.palette.warning.contrastText
        : theme.palette.common.white,
  },
});

const avatarSx = {
  bgcolor: 'primary.main',
  width: 32,
  height: 32,
  margin: '0 8px',
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
    connectionRole,
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
    <Paper sx={chatContainerSx} className="w-full flex-1 max-w-full md:max-w-7xl rounded-none">
      <Box className="flex flex-col md:flex-row flex-1 overflow-auto ">
        <Box className="flex flex-col flex-1 md:flex-[2] p-4 h-full overflow-y-auto ">
          <Typography variant="h6" component="div" className="font-bold text-center mb-4" color="text.primary">
            Live Streams
          </Typography>
          {allErrors && (
            <Alert severity="error" className="mb-4">
              {allErrors}
            </Alert>
          )}
          {isOVSessionLoading && !currentSessionId && (
            <Box className="flex justify-center items-center h-40">
              <CircularProgress />
              <Typography className="ml-2">Connecting to session...</Typography>
            </Box>
          )}
          {currentSessionId ? (
            <>
              <OpenViduVideoGrid publisher={publisher} subscribers={subscribers} />
              <OpenViduControls
                isCameraActive={isCameraActive}
                toggleCamera={toggleCamera}
                isMicActive={isMicActive}
                toggleMic={toggleMic}
                publisher={publisher}
              />
              <Box className="flex justify-center mt-4">
                <Button
                  variant="outlined"
                  color="error"
                  onClick={leaveSession}
                  disabled={isOVSessionLoading || !currentSessionId}
                  startIcon={<CallEndIcon />}
                >
                  Leave Session
                </Button>
              </Box>
            </>
          ) : (
            <Typography variant="body1" color="text.secondary" className="text-center mt-4">
              No active session. Waiting to connect...
            </Typography>
          )}
        </Box>

        <Box className="flex flex-col flex-1 md:flex-1 " sx={{borderTop: `1px solid ${theme.palette.divider}`, borderLeft: `1px solid ${theme.palette.divider}`}}>
          <Box className="p-4" sx={{borderBottom: `1px solid ${theme.palette.divider}`}}>
            <Typography variant="h6" component="div" className="font-bold text-center" color="text.primary">
              Room Chat
            </Typography>
          </Box>

          <List sx={messageListSx}>
            {messages.map((msg) => (
              <ListItem key={msg.id} sx={messageBubbleSx(msg.isLocal, msg.TYPE || 'chat', theme)} className="flex-col items-stretch">
                <Box className={`flex items-center ${msg.isLocal ? 'justify-end' : 'justify-start'} w-full`}>
                  {!msg.isLocal && (
                    <Avatar sx={avatarSx} src={msg.SENDER_PICTURE}> 
                      {msg.SENDER_NAME ? msg.SENDER_NAME[0].toUpperCase() : '?'}
                    </Avatar>
                  )}
                  <ListItemText
                    primary={msg.SENDER_NAME}
                    secondary={msg.MESSAGE}
                    secondaryTypographyProps={{
                      component: 'div',
                      className: `text-sm ${msg.isLocal ? '' : ''} rounded-lg p-2 max-w-xs`
                    }}
                    primaryTypographyProps={{
                      className: `text-xs font-semibold mb-1 ${msg.isLocal ? 'text-right pr-2' : 'text-left pl-2'}`
                    }}
                    className={`flex flex-col ${msg.isLocal ? 'items-end' : 'items-start'}`}
                  />
                  {msg.isLocal && (
                    <Avatar sx={avatarSx} src={msg.SENDER_PICTURE}> 
                      {msg.SENDER_NAME ? msg.SENDER_NAME[0].toUpperCase() : '?'}
                    </Avatar>
                  )}
                </Box>
                <Typography variant="caption" color={msg.TYPE === 'whisper' ? 'warning.dark' : 'text.primary'} className={`text-xs mt-1 ${msg.isLocal ? 'self-end pr-14' : 'self-start pl-14'}`}>
                  <span>{msg.TYPE === 'whisper' ? ' whispered to ' : ''}</span>
                  <span>{msg.TYPE === 'whisper' ? msg.RECEIVER_NAME : ''}</span>
                  <span>{msg.TYPE === 'whisper' ? ' on ' : ''}  </span>
                  <span>{new Date(msg.TIME).toLocaleTimeString()}</span>
                </Typography>
              </ListItem>
            ))}
            <div ref={messagesEndRef} />
          </List>

          <Box sx={messageInputContainerSx} className="flex items-center gap-2">
            <TextField
              fullWidth
              multiline
              maxRows={4}
              variant="outlined"
              placeholder="Type a message..." value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={overallLoading}
              className="flex-grow"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSendMessage}
              disabled={messageInput.trim() === '' || overallLoading}
              startIcon={overallLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            >
              Send
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};
