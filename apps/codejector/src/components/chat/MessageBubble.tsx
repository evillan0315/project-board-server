/**
 * @file Renders a single chat message bubble, styling it based on the sender.
 */

import React from 'react';
import { Box, Typography, Paper, Avatar, useTheme } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ReactMarkdownWithCodeCopy from '@/components/markdown/ReactMarkdownWithCodeCopy';
import { MessageBubbleProps, Sender } from './types'; // Import Sender enum
import { useStore } from '@nanostores/react';
import { user } from '@/stores/authStore';

/**
 * Renders a single chat message bubble, styling it based on the sender.
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({ message, currentUserId }) => {
  const $user = useStore(user);
  // Check if the message was created by the current authenticated user.
  // This uses `createdById` which is the actual user's DB ID from the backend.
  const isCurrentUser = message.sender === Sender.USER && message.createdById === currentUserId;
  const theme = useTheme();

  // Determine if the message is from the bot using the sender property from the Message interface
  const isBot = message.sender === Sender.BOT;

  // Determine colors and alignment using theme palette
  const bubbleSx = {
    backgroundColor: isCurrentUser
      ? theme.palette.primary.main
      : isBot
        ? theme.palette.background.main // A subtle background for bot messages
        : theme.palette.success.main, // Example for other users, could be another theme color
    color: isCurrentUser ? theme.palette.primary.contrastText : isBot ? theme.palette.text.primary : theme.palette.primary.contrastText,
    borderRadius: '12px',
    ...(isCurrentUser && { borderBottomRightRadius: '2px' }), // Adjust corner for current user
    ...(!isCurrentUser && { borderBottomLeftRadius: '2px' }) // Adjust corner for bot/other user
  };

  const alignmentClass = isCurrentUser ? 'justify-end' : 'justify-start';

  const userAvatar = isCurrentUser ? (
    $user?.image ? (
      <Avatar src={$user.image} alt={$user.name || 'User Avatar'} sx={{ width: 32, height: 32, ml: 1 }} />
    ) : (
      <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32, ml: 1 }}>
        <AccountCircleIcon fontSize="small" />
      </Avatar>
    )
  ) : (
    <Avatar sx={{ bgcolor: isBot ? theme.palette.grey[500] : theme.palette.success.main, width: 32, height: 32, mr: 1 }}>
      {isBot ? <SmartToyIcon fontSize="small" /> : <AccountCircleIcon fontSize="small" />}
    </Avatar>
  );

  return (
    <Box className={`flex w-full my-2 ${alignmentClass}`}>
      {!isCurrentUser && userAvatar}
      <Paper
        elevation={1}
        className={`max-w-sm md:max-w-lg p-3 rounded-xl shadow-md overflow-auto`}
        sx={bubbleSx}
      >
        <Typography className="whitespace-pre-wrap">
          {isBot ? (
            <ReactMarkdownWithCodeCopy>
            {message.content}
            </ReactMarkdownWithCodeCopy>
          ) : message.content }
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: 'block', textAlign: 'right' }}>
          {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Paper>
      {isCurrentUser && userAvatar}
    </Box>
  );
};

export default MessageBubble;
