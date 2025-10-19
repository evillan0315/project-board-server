/**
 * @file Provides the text input and send button functionality for the chat.
 */

import React, { useState } from 'react';
import { Box, TextField, Button, useTheme, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

import { MessageInputProps } from './types';

// Bot User ID for bot-generated messages
const BOT_USER_ID = 'user-bot';

/**
 * Provides the text input and send button functionality.
 */
const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const theme = useTheme();

  // Placeholder for the actual API key. The Canvas environment will inject this if needed.
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string; // Access API key from environment variables

  // Helper function to simulate LLM response generation with exponential backoff
  const generateBotResponse = async (userText: string) => {
    if (!apiKey) {
      console.error('VITE_GEMINI_API_KEY is not defined. Cannot generate bot response.');
      return "Sorry, the AI key is not configured.";
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const systemPrompt = "You are a friendly and helpful chat bot assistant. Respond concisely to the user's message.";

    const payload = {
      contents: [{ parts: [{ text: userText }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    let attempt = 0;
    const maxRetries = 5;

    while (attempt < maxRetries) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const result = await response.json();
          const botText = result.candidates?.[0]?.content?.parts?.[0]?.text;
          return botText || "Sorry, I couldn't generate a response.";
        }

        if (response.status === 429 && attempt < maxRetries - 1) {
          // Retry on rate limit (429)
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }

        // Handle other non-retryable errors
        console.error("API Error:", response.status, response.statusText);
        return "An API error occurred.";

      } catch (error) {
        if (attempt < maxRetries - 1) {
          // Retry on network errors
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }
        console.error("Fetch failed after retries:", error);
        return "Network error or fetch failure.";
      }
    }
    return "Failed to get a response after multiple retries.";
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = inputText.trim();
    if (!trimmedText) return;

    // 1. Send User Message
    onSendMessage(trimmedText);
    setInputText('');
    setIsLoading(true);

    // 2. Simulate Bot Response
    const botResponseText = await generateBotResponse(trimmedText);

    // 3. Send Bot Message (Delayed to simulate processing)
    if (botResponseText) {
      setTimeout(() => {
        onSendMessage(botResponseText, BOT_USER_ID);
        setIsLoading(false);
      }, 500); // 500ms delay to visually separate user and bot messages
    } else {
        setIsLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSend}
      className="flex p-4 rounded-b-lg shadow-inner gap-2"
      sx={{
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Type a message..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        disabled={isLoading}
        size="small"
        className="mr-2"
        onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
            }
        }}
        sx={{
            '& .MuiOutlinedInput-root': {
                borderRadius: '9999px',
            },
        }}
      />
      <IconButton
        type="submit"
        color="primary"
        disabled={!inputText.trim() || isLoading}
        className="rounded-full transition-all duration-300 transform hover:scale-[1.03]"
        sx={{ p: '8px' }} // Adjusted padding for IconButton
      >
        <SendIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default MessageInput;
