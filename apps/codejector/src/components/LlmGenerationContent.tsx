import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { llmStore } from '@/stores/llmStore';
import { RequestType } from '@/types/llm';
import { Box, Paper, useTheme, IconButton } from '@mui/material';
import PromptGenerator from '@/components/code-generator/PromptGenerator';
import { CodeGeneratorMain } from '@/components/code-generator/CodeGeneratorMain';
import DragIndicatorOutlinedIcon from '@mui/icons-material/DragIndicatorOutlined';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
// Constants for layout.
const PANEL_HEADER_HEIGHT = 48; // Consistent height for all collapsed panel headers (including internal padding)
const AI_OUTPUT_LOG_DEFAULT_HEIGHT = 170; // Default height for the AI Output Log section

/**
 * Placeholder for LLM Generation sidebar content.
 */
const LlmGenerationContent: React.FC = () => {
  const { lastLlmResponse } = useStore(llmStore);
  const theme = useTheme();
  const [showOptions, setShowOptions] = useState(true);
  const [showAiOutputLog, setShowAiOutputLog] = useState(true);
  const [showAiResponseDisplay, setShowAiResponseDisplay] = useState(true);
  const [showPromptGenerator, setShowPromptGenerator] = useState(true);

  return (
    <Box className="flex flex-col h-full  w-full">
      {/* Sticky Header */}
      <Paper
        sx={{
          position: 'sticky',
          top: 0,
          left: 0,
          zIndex: 1, // Ensure it stays on top of the file list
          bgcolor: theme.palette.background.paper, // Match background color
          p: 0.6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`,
          boxShadow: 0,
        }}
      >
        <Box className="flex items-center gap-0">
          <IconButton sx={{ color: theme.palette.text.secondary, mr: 1 }}>
            <MenuOutlinedIcon />
          </IconButton>
        </Box>
        <Box>LLM Code Generator</Box>

        <Box className="flex items-center gap-0">
          <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
            <DragIndicatorOutlinedIcon />
          </IconButton>
        </Box>
      </Paper>
      <Box className="p-6 flex flex-col h-full  w-full">
        <Box className="flex flex-col flex-1 w-full">
          <Paper
            elevation={3}
            className="w-full max-w-7xl m-auto"
            sx={{
              p: 2,
              bgcolor: theme.palette.background.default,
              borderTop: `1px solid ${theme.palette.divider}`,
              borderRadius: 6,
              boxShadow: 1,
            }}
          >
            <CodeGeneratorMain data={lastLlmResponse} />
          </Paper>
        </Box>

        {/* PromptGenerator fixed at bottom of parent */}
        <Paper
          elevation={3}
          sx={{
            position: 'sticky',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            p: 2,
            bgcolor: theme.palette.background.default,
            borderTop: `1px solid ${theme.palette.divider}`,
            borderRadius: 6,
            boxShadow: 1,
          }}
        >
          <PromptGenerator requestType={'LLM_GENERATION'} />
        </Paper>
      </Box>
    </Box>
  );
};

export default LlmGenerationContent;
