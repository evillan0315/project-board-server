/**
 * @file Renders the full list of messages and handles auto-scrolling.
 */

import React, { useRef, useEffect } from 'react';
import { Box, List, ListItem, Typography, useTheme } from '@mui/material';

import { MessageListProps } from './types';
import MessageBubble from './MessageBubble';

/**
 * Renders the full list of messages and handles auto-scrolling.
 */
const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Box
      className="flex-grow overflow-y-auto p-4 rounded-t-lg"
      sx={{ backgroundColor: theme.palette.background.default }}
    >
      <List className="flex flex-col">
        {messages.map((message) => (
          <ListItem key={message.id} className="p-0">
            <MessageBubble message={message} currentUserId={currentUserId} />
          </ListItem>
        ))}
        <div ref={messagesEndRef} />
      </List>
      {messages.length === 0 && (
        <Box className="flex items-center justify-center h-full text-gray-500">
          <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary }}>
            Start the conversation...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MessageList;
