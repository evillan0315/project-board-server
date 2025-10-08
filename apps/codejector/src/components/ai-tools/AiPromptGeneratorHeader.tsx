import React from 'react';
import { Box, IconButton, useTheme, Paper } from '@mui/material';
import DragIndicatorOutlinedIcon from '@mui/icons-material/DragIndicatorOutlined';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
interface AiPromptGeneratorHeaderProps {
  // Define any props here
}

const AiPromptGeneratorHeader: React.FC<AiPromptGeneratorHeaderProps> = () => {
  const theme = useTheme();
  return (
    <Paper
      sx={{
        position: 'sticky',
        top: 0,
        left: 0,
        borderRadius: 0,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: 1, // Ensure it stays on top of the file list
        p: 0.6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 0,
      }}
    >
      <Box className="flex items-center gap-0">
        <IconButton sx={{ color: theme.palette.text.secondary, mr: 1 }}>
          <MenuOutlinedIcon />
        </IconButton>
      </Box>
      <Box>Ai Chat</Box>

      <Box className="flex items-center gap-0">
        <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
          <DragIndicatorOutlinedIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default AiPromptGeneratorHeader;
