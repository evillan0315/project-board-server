import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { LiveMessage } from '@/types/gemini-live';

interface LiveInteractionProps {
  messages: LiveMessage[];
}

const LiveInteraction: React.FC<LiveInteractionProps> = ({ messages }) => {
  return (
    <Box className="flex flex-col gap-3 p-4 border border-gray-200 rounded-lg h-96 overflow-y-auto bg-gray-50">
      {messages.length === 0 ? (
        <Typography variant="body2" color="text.secondary" className="text-center mt-8">
          Start a session and say something to begin the conversation.
        </Typography>
      ) : (
        messages.map((msg, index) => (
          <Box
            key={index}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Paper
              elevation={1}
              className={`p-3 rounded-lg max-w-[80%] ${
                msg.sender === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none' // User bubble style
                  : 'bg-gray-200 text-gray-800 rounded-bl-none' // AI bubble style
              }`}
            >
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {msg.text}
              </Typography>
              {msg.audioUrl && <audio controls src={msg.audioUrl} className="w-full mt-2" />}
            </Paper>
          </Box>
        ))
      )}
    </Box>
  );
};

export default LiveInteraction;
