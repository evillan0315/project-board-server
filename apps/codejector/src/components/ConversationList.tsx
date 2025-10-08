// src/components/ConversationList.tsx

import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  conversationStore,
  loadConversations,
  selectConversation,
} from '@/stores/conversationStore';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  CircularProgress,
  useTheme,
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

/**
 * Displays a list of AI conversations.
 */
const ConversationList: React.FC = () => {
  const { conversations, isLoading, error, selectedConversationId } =
    useStore(conversationStore);
  const theme = useTheme();

  useEffect(() => {
    loadConversations();
  }, []);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'start',
          height: '100%',
          py: 1,
        }}
      >
        <CircularProgress size={20} />
        <Typography
          variant="body2"
          sx={{ ml: 2, color: theme.palette.text.secondary, my: 2 }}
        >
          Loading conversations...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, color: theme.palette.error.main }}>
        <Typography variant="body2">Error: {error}</Typography>
      </Box>
    );
  }

  if (conversations.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary }}
        >
          No conversations found. Start a new AI chat!
        </Typography>
      </Box>
    );
  }

  return (
    <List dense sx={{ height: '100%', overflowY: 'auto', p: 0 }}>
      {' '}
      {/* Changed maxHeight to height */}
      {conversations.map((conv) => (
        <ListItem
          key={conv.conversationId}
          disablePadding
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            '&:last-child': { borderBottom: 'none' },
          }}
        >
          <ListItemButton
            selected={selectedConversationId === conv.conversationId}
            onClick={() => selectConversation(conv.conversationId)}
            sx={{
              py: 1,
              px: 2,
              '&.Mui-selected': {
                bgcolor: theme.palette.action.selected,
                borderLeft: `3px solid ${theme.palette.primary.main}`,
                pl: 1.7, // Adjust padding due to border
                '&:hover': {
                  bgcolor: theme.palette.action.selected,
                },
              },
            }}
          >
            <ChatBubbleOutlineIcon
              fontSize="small"
              sx={{
                mr: 1.5,
                color:
                  selectedConversationId === conv.conversationId
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
              }}
            />
            <ListItemText
              primary={
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight:
                      selectedConversationId === conv.conversationId
                        ? 'bold'
                        : 'normal',
                    color: theme.palette.text.primary,
                  }}
                >
                  {conv.firstPrompt || 'New Conversation'}
                </Typography>
              }
              secondary={
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    fontSize: '0.7rem',
                  }}
                >
                  {new Date(conv.lastUpdatedAt).toLocaleString()}
                  {conv.requestCount > 1 && ` • ${conv.requestCount} messages`}
                </Typography>
              }
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};

export default ConversationList;
