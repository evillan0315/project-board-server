// src/pages/TerminalPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import TerminalIcon from '@mui/icons-material/Terminal';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { XTerminal } from '@/components/Terminal/Terminal';
//import { useXTerminal } from '@/hooks/useXTerminal';
import { getToken } from '@/stores/authStore';
import { handleLogout } from '@/services/authService';

interface TerminalPageProps {}

export const TerminalPage: React.FC<TerminalPageProps> = () => {
  const theme = useTheme();
  const [selectedSessionType, setSelectedSessionType] =
    useState<string>('local');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sshConfig, setSshConfig] = useState({
    host: '',
    port: 22,
    username: '',
    password: '',
    privateKey: '',
  });
  const [terminalHeight, setTerminalHeight] = useState(400); // Default height

  /*const {
    output,
    currentPath,
    systemInfo,
    isConnected,
    connect,
    disconnect,
    executeCommand,
    browseHistory,
    inputRef,
    appendOutput,
  } = useXTerminal();*/

  useEffect(() => {
    // Auto-connect when component mounts if we have a token
    const token = getToken();
    //if (token) {
    //  connect();
    //}
  }, []);

  const handleSessionTypeChange = (event: SelectChangeEvent<string>) => {
    setSelectedSessionType(event.target.value);
  };

  const handleConnect = () => {
    if (selectedSessionType === 'ssh') {
      // For SSH, we need to validate and connect with the provided config
      if (!sshConfig.host || !sshConfig.username) {
        //appendOutput('Error: SSH host and username are required\n');
        return;
      }
      // This would be implemented to send SSH connection request via socket
      //appendOutput(`Connecting to SSH host: ${sshConfig.host}\n`);
      // socketService.sshConnect(sshConfig);
    } else {
      // For local terminal, just connect
      //connect();
    }
  };

  const handleDisconnect = () => {
    //disconnect();
  };

  const handleSettingsOpen = () => {
    setSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  const handleAppLogout = () => {
    handleLogout();
    window.location.reload();
  };

  const handleSshConfigChange = (field: string, value: string | number) => {
    setSshConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TerminalIcon
            sx={{ fontSize: 60, color: theme.palette.secondary.main }}
          />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Web Terminal
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" align="center">
          Connect to a local or remote terminal session.
        </Typography>

        <Box sx={{ width: '100%', maxWidth: 800, mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel id="session-type-select-label">
                Session Type
              </InputLabel>
              <Select
                labelId="session-type-select-label"
                id="session-type-select"
                value={selectedSessionType}
                label="Session Type"
                onChange={handleSessionTypeChange}
                //disabled={isConnected}
              >
                <MenuItem value="local">Local</MenuItem>
                <MenuItem value="ssh">SSH</MenuItem>
              </Select>
            </FormControl>

            {/*{!isConnected ? (
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleConnect}
                //disabled={isConnected}
              >
                Connect
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="error"
                startIcon={<StopIcon />}
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            )}*/}

            <Tooltip title="Settings">
              <IconButton onClick={handleSettingsOpen}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Logout">
              <IconButton onClick={handleAppLogout} color="error">
                <LogoutIcon />
              </IconButton>
            </Tooltip>

            {/*isConnected && (
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                <Box
                  sx={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: isConnected ? '#4caf50' : '#f44336',
                    marginRight: '8px',
                  }}
                />
                <Typography variant="caption">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Typography>
              </Box>
            )*/}
          </Box>

          {selectedSessionType === 'ssh' /*&& !isConnected*/ && (
            <Box
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 3,
              }}
            >
              <Typography variant="h6" gutterBottom>
                SSH Connection Details
              </Typography>
              <Box
                sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
              >
                <TextField
                  label="Host"
                  value={sshConfig.host}
                  onChange={(e) =>
                    handleSshConfigChange('host', e.target.value)
                  }
                  fullWidth
                />
                <TextField
                  label="Port"
                  type="number"
                  value={sshConfig.port}
                  onChange={(e) =>
                    handleSshConfigChange(
                      'port',
                      parseInt(e.target.value) || 22,
                    )
                  }
                  fullWidth
                />
                <TextField
                  label="Username"
                  value={sshConfig.username}
                  onChange={(e) =>
                    handleSshConfigChange('username', e.target.value)
                  }
                  fullWidth
                />
                <TextField
                  label="Password"
                  type="password"
                  value={sshConfig.password}
                  onChange={(e) =>
                    handleSshConfigChange('password', e.target.value)
                  }
                  fullWidth
                />
                <TextField
                  label="Private Key"
                  multiline
                  rows={3}
                  value={sshConfig.privateKey}
                  onChange={(e) =>
                    handleSshConfigChange('privateKey', e.target.value)
                  }
                  fullWidth
                  sx={{ gridColumn: '1 / -1' }}
                />
              </Box>
            </Box>
          )}

          <XTerminal
            onLogout={handleAppLogout}
            terminalHeight={terminalHeight}
          />
        </Box>
      </Paper>

      <Dialog
        open={settingsOpen}
        onClose={handleSettingsClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Terminal Settings</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure your terminal preferences. (Settings implementation
            pending)
          </Typography>
          {/* Settings form would go here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSettingsClose}>Close</Button>
          <Button onClick={handleSettingsClose} variant="contained">
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TerminalPage;
