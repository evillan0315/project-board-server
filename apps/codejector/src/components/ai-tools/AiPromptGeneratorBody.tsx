import React from 'react';
import { Box, useTheme } from '@mui/material';
import { useStore } from '@nanostores/react';
import { aiChatStore } from '@/stores/aiChatStore';
import 'github-markdown-css/github-markdown.css';
import 'github-markdown-css/github-markdown-dark.css';
import ReactMarkdownWithCodeCopy from '@/components/markdown/ReactMarkdownWithCodeCopy';

interface AiPromptGeneratorBodyProps {
  // Define any props here
}

const AiPromptGeneratorBody: React.FC<AiPromptGeneratorBodyProps> = () => {
  const $aiChat = useStore(aiChatStore);
  const theme = useTheme();

  return (
    <Box className="flex flex-col h-full">
      {/* Display messages from aiChatStore */}
      {/*error && <Box color="error.main">Error: {error}</Box>*/}
      {/* messages.length > 0 && */}
      <Box mt={2} className="flex-grow overflow-auto px-4 ">
        {$aiChat.messages.map((message, index) => (
          <Box
            id="ai-chat-message-wrapper"
            key={index}
            mt={1}
            className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <Box
              className={`rounded-lg p-2 ${
                message.role === 'user' ? `text-right` : 'text-left mb-2'
              }`}
              sx={{
                backgroundColor:
                  message.role === 'user'
                    ? theme.palette.background.default
                    : theme.palette.background.paper,
              }}
            >
              <strong>{message.role === 'user' ? 'You:' : 'AI:'}</strong>
              {message.role === 'model' && (
                <ReactMarkdownWithCodeCopy>
                  {message.text}
                </ReactMarkdownWithCodeCopy>
              )}
              {message.role === 'user' && <Box ml={1}>{message.text}</Box>}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default AiPromptGeneratorBody;
