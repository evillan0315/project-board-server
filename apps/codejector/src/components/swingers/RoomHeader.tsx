import React, { useCallback } from 'react';
import { Box, IconButton, ButtonGroup, Tooltip, Typography } from '@mui/material';
import DragIndicatorOutlinedIcon from '@mui/icons-material/DragIndicatorOutlined';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

import { showDialog } from '@/stores/dialogStore';
import { RoomConnectionDialog } from '@/components/swingers/dialogs/RoomConnectionDialog';
import { useStore } from '@nanostores/react';
import { currentDefaultConnection } from '@/components/swingers/stores/connectionStore';

interface RoomHeaderProps {
  // No props needed for this context
}

export const RoomHeader: React.FC<RoomHeaderProps> = () => {
  const $currentDefaultConnection = useStore(currentDefaultConnection);

  const handleShowDefaultClientData = useCallback(() => {
    showDialog({
      title: 'Default Client Connection Data',
      content: (
        <Box sx={{ p: 2 }}>
          { $currentDefaultConnection.id ? (
            <>
              <Typography variant="body1" gutterBottom className="font-semibold">Connection ID: <span className="font-normal">{$currentDefaultConnection.id}</span></Typography>
              <Typography variant="body1" gutterBottom className="font-semibold">Session ID: <span className="font-normal">{$currentDefaultConnection.sessionId}</span></Typography>
              <Typography variant="body1" gutterBottom className="font-semibold">Token: <span className="font-normal break-all">{$currentDefaultConnection.token}</span></Typography>
              <Typography variant="body2" gutterBottom className="font-semibold">Role: <span className="font-normal">{$currentDefaultConnection.role}</span></Typography>
              { $currentDefaultConnection.clientData && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom className="font-semibold">Client Data:</Typography>
                  <pre className="whitespace-pre-wrap break-all text-xs p-2 rounded bg-gray-100 dark:bg-gray-800">{
                    JSON.stringify(JSON.parse($currentDefaultConnection.clientData), null, 2)
                  }</pre>
                </Box>
              )}
            </>
          ) : (
            <Typography variant="body1" color="text.secondary">No default client connection data found.</Typography>
          )}
        </Box>
      ),
      maxWidth: 'sm',
    });
  }, [$currentDefaultConnection]);

  const handleConnectDefaultClientGlobally = useCallback(() => {
    showDialog({
      title: 'Connect Default Client',
      content: <RoomConnectionDialog connectionRole={'SUBSCRIBER'}/>,
      maxWidth: 'md',
      fullWidth: true,
      showCloseButton: true,
    });
  }, []);

  return (
    <ButtonGroup variant="outlined" aria-label="room actions button group" size="small">
      <Tooltip title="Show Default Client Data">
        <IconButton size="small" onClick={handleShowDefaultClientData} color="info">
          <AccountCircleIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Connect Default Client (Global)">
        <IconButton size="small" onClick={handleConnectDefaultClientGlobally} color="primary">
          <VideoCallIcon />
        </IconButton>
      </Tooltip>
      <IconButton size="small">
        <DragIndicatorOutlinedIcon />
      </IconButton>
    </ButtonGroup>
  );
};
