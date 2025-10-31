import React from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  IconButton,
  Typography,
  Tooltip,
  useMediaQuery,
  useTheme,
  Paper,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import Brightness1Icon from '@mui/icons-material/Brightness1';

import { CarbonTerminal } from '@/components/icons/CarbonTerminal';
import {
  isTerminalVisible,
  setShowTerminal,
  disconnectTerminal,
} from '@/components/Terminal/stores/terminalStore';

interface TerminalToolbarProps {
  isConnected: boolean;
  currentPath: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onSettings: () => void;
  onLogout: () => void;
  onCloseDrawer?: () => void; // NEW: Optional callback to close a parent drawer/modal
  sx?: any;
}

export const TerminalToolbar: React.FC<TerminalToolbarProps> = ({
  isConnected,
  currentPath,
  onConnect,
  onDisconnect,
  onSettings,
  onLogout,
  onCloseDrawer, // NEW: Destructure the prop
  sx,
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const showTerminal = useStore(isTerminalVisible);

  /**
   * ✅ Disconnect socket session first, then hide terminal or close parent drawer.
   */
  const handleCloseTerminal = () => {
    if (isConnected) {
      disconnectTerminal();
    }
    if (onCloseDrawer) {
      onCloseDrawer(); // Call the parent drawer's close handler if available
    } else {
      setShowTerminal(!showTerminal); // Fallback to global visibility toggle
    }
  };

  return (
    <Paper
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 0.6,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        border: 0,
        borderBottom: `1px solid`,
        borderColor: `${theme.palette.divider}`,
        borderRadius: 0,
        boxShadow: 0,
        height: '36px',
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title="Close Terminal">
          <IconButton onClick={handleCloseTerminal} size="small">
            <CarbonTerminal fontSize={`1.2em`} />
          </IconButton>
        </Tooltip>
        <Typography variant="subtitle1" sx={{ marginRight: '16px' }}>
          Terminal
        </Typography>
      </Box>

      <Box>
        {!isSmallScreen && (
          <Tooltip title="Close Terminal">
            <IconButton
              onClick={handleCloseTerminal}
              size="small"
              sx={{
                color: isConnected ? '#4caf50' : '#f44336',
                marginLeft: '8px',
              }}
            >
              <Brightness1Icon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Paper>
  );
};
