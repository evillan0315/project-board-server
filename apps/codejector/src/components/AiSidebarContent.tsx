import React from 'react';
import { useStore } from '@nanostores/react';
import { aiEditorStore } from '@/stores/aiEditorStore';
import { Box, useTheme } from '@mui/material';
import LlmGenerationContent from '@/components/LlmGenerationContent';

/**
 * Consolidates the AI editor sidebar content, including the
 * AI Response Display, Prompt Generator, and the new global Output Logger.
 * Provides collapsible panels for better layout management.
 */
const AiSidebarContent: React.FC = () => {
  const { lastLlmResponse } = useStore(aiEditorStore);
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(2),
        overflowY: 'auto',
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
      //className="h-full"
    >
      <LlmGenerationContent />
    </Box>
  );
};

export default AiSidebarContent;
