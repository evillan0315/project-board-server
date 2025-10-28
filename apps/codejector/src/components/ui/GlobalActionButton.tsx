import React from 'react';
import { Box, Button, Tooltip, useTheme, IconButton } from '@mui/material';

import { GlobalAction } from '@/types/app'; // Corrected import path for GlobalAction

interface GlobalActionButtonProps {
  globalActions: GlobalAction[];
  iconOnly?: boolean; // New prop for icon-only mode
}

function GlobalActionButton({ globalActions, iconOnly = false }: GlobalActionButtonProps) { // Default iconOnly to false
  const theme = useTheme();

  const boxSx = {
    display: 'flex',
    gap: 1,
  };

  return (
    <Box sx={boxSx}>
      {globalActions &&
        globalActions.map((action, index) =>
          iconOnly ? (
            <Tooltip key={index} title={action.label} arrow>
              <IconButton
                onClick={action.action}
                color={action.color || 'primary'}
                // variant={action.variant || 'contained'} // IconButton doesn't have a 'variant' prop in the same way as Button
                size="small" 
                disabled={action.disabled}
               >
                {action.icon ? action.icon : null}
              </IconButton>
            </Tooltip>
          ) : (
            <Button
              key={index}
              onClick={action.action}
              color={action.color || 'primary'}
              variant={action.variant || 'contained'}
              startIcon={action.icon || null} // Use startIcon directly
              disabled={action.disabled}
            >
              {action.label}
            </Button>
          ),
        )}
    </Box>
  );
}

export default GlobalActionButton;
