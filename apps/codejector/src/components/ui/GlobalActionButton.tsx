import React from 'react';
import { Box, Button, Tooltip, useTheme, IconButton } from '@mui/material';
import { ButtonColor, ButtonVariant } from '@mui/material/Button';

export interface GlobalAction {
  label: string;
  action: () => void;
  icon?: React.ElementType;
  color?: ButtonColor;
  variant?: ButtonVariant;
  disabled?: boolean;
}

interface GlobalActionButtonProps {
  globalActions: GlobalAction[];
  iconOnly?: boolean; // New prop for icon-only mode
}

function GlobalActionButton({ globalActions, iconOnly=true }: GlobalActionButtonProps) {
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
                variant={action.variant || 'contained'}
                size="small" 
                disabled={action.disabled}
               >
                {action.icon ? <action.icon /> : null}
              </IconButton>
            </Tooltip>
          ) : (
            <Button
              key={index}
              onClick={action.action}
              color={action.color || 'primary'}
              variant={action.variant || 'contained'}
              startIcon={action.icon ? <action.icon /> : null}
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
