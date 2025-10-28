import React from 'react';
import { Box, IconButton, useTheme, Paper, Typography } from '@mui/material'; // Ensure Typography is imported
import DragIndicatorOutlinedIcon from '@mui/icons-material/DragIndicatorOutlined';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
interface SubscriberHeaderProps {
  // Define any props here
}

export const SubscriberHeader: React.FC<SubscriberHeaderProps> = () => {
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
      <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
        {' '}
        {/* Wrap in Box for centering */}
        <Typography variant="h6" component="span" className="font-semibold">
          Subscribers
        </Typography>
      </Box>

      <Box className="flex items-center gap-0">
        <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
          <DragIndicatorOutlinedIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};
