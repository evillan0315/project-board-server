import { rightSidebarContent, leftSidebarContent } from '@/stores/uiStore';
import { useStore } from '@nanostores/react';
import { Box, useTheme } from '@mui/material';

export const RightSidebarContent: React.FC = () => {
  const theme = useTheme();
  const content = useStore(rightSidebarContent);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(2),
        overflowY: 'auto',
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        height: '100%', // ensure it stretches fully inside sidebar
      }}
    >
      {content}
    </Box>
  );
};

export const LeftSidebarContent: React.FC = () => {
  const theme = useTheme();
  const content = useStore(leftSidebarContent);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(2),
        overflowY: 'auto',
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        height: '100%',
      }}
    >
      {content}
    </Box>
  );
};
