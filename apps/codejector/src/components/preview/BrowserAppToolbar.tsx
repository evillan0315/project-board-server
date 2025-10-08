import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { appPreviewStore } from '@/stores/appPreviewStore';
import { useTheme } from '@mui/material/styles';
import {
  IconButton,
  TextField,
  Paper,
  Box,
  Tooltip,
  Menu,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import MobileScreenShareIcon from '@mui/icons-material/MobileScreenShare';
import TabletIcon from '@mui/icons-material/Tablet';
import LaptopIcon from '@mui/icons-material/Laptop';
import HomeIcon from '@mui/icons-material/Home';
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
import SettingsIcon from '@mui/icons-material/Settings';

interface BrowserAppToolbarProps {
  onRefresh?: () => void;
  onGoBack?: () => void; // Prop for back navigation
}

const BrowserAppToolbar: React.FC<BrowserAppToolbarProps> = ({
  onRefresh,
  onGoBack,
}) => {
  const theme = useTheme();
  const { currentUrl, screenSize, zoomLevel, useProxy } = useStore(appPreviewStore);
  const [internalUrl, setInternalUrl] = useState(currentUrl);

  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null); // For settings menu
  const openSettings = Boolean(settingsAnchorEl);

  useEffect(() => {
    setInternalUrl(currentUrl);
  }, [currentUrl]);

  const handleInternalUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInternalUrl(event.target.value);
  };

  const handleUrlSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedUrl = internalUrl.trim();
    if (trimmedUrl && isValidUrl(trimmedUrl)) {
      appPreviewStore.setKey('currentUrl', trimmedUrl); // Update store directly
    } else {
      console.error('Invalid URL:', trimmedUrl);
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const getScreenSizeButtonColor = (size: 'mobile' | 'tablet' | 'desktop') => {
    return screenSize === size ? 'primary' : 'inherit';
  };

  const handleZoomIn = () => {
    appPreviewStore.setKey('zoomLevel', Math.min(zoomLevel + 0.1, 2.0)); // Max 200%
  };

  const handleZoomOut = () => {
    appPreviewStore.setKey('zoomLevel', Math.max(zoomLevel - 0.1, 0.5)); // Min 50%
  };

  const handleSettingsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const handleToggleProxy = (event: React.ChangeEvent<HTMLInputElement>) => {
    appPreviewStore.setKey('useProxy', event.target.checked);
  };

  const handleResetToDefault = () => {
    appPreviewStore.setKey('currentUrl', import.meta.env.VITE_PREVIEW_APP_URL || '');
  };

  return (
    <Paper
      elevation={2}
      className="p-2 w-full rounded-0"
      sx={{
        borderRadius: '6px 6px 0 0px',
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        border: `1px solid ${theme.palette.divider}`,
        borderBottom: 0,
        marginBottom: `1px`,
      }}
    >
      <Box className="flex items-center gap-2 w-full">
        <Tooltip title="Reset URL to default">
          <IconButton aria-label="reset url" onClick={handleResetToDefault}>
            <HomeIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Go back in history">
          <IconButton aria-label="go back" onClick={onGoBack} disabled={!onGoBack}>
            <KeyboardBackspaceIcon />
          </IconButton>
        </Tooltip>
        <form onSubmit={handleUrlSubmit} className="flex-grow">
          <TextField
            label="URL"
            variant="outlined"
            size="small"
            value={internalUrl}
            onChange={handleInternalUrlChange}
            onBlur={() => {
              const trimmedUrl = internalUrl.trim();
              if (isValidUrl(trimmedUrl)) {
                appPreviewStore.setKey('currentUrl', trimmedUrl);
              }
            }}
            className="w-full"
            error={!!internalUrl && !isValidUrl(internalUrl)}
            helperText={!!internalUrl && !isValidUrl(internalUrl) ? 'Invalid URL format' : ''}
            InputProps={{
              sx: {
                height: 40, // Make text field smaller
                '& .MuiOutlinedInput-input': { padding: '8px 12px' }, // Adjust inner padding
                '& .MuiInputLabel-root': { top: -6 }, // Adjust label position
                '& .MuiInputLabel-shrink': { top: 0 }, // Adjust shrunk label position
              },
            }}
          />
        </form>
        <Tooltip title="Refresh iframe">
          <IconButton aria-label="refresh" onClick={onRefresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom in">
          <IconButton aria-label="zoom in" onClick={handleZoomIn}>
            <ZoomInIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom out">
          <IconButton aria-label="zoom out" onClick={handleZoomOut}>
            <ZoomOutIcon />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <Tooltip title="Mobile view">
          <IconButton
            aria-label="mobile view"
            onClick={() => appPreviewStore.setKey('screenSize', 'mobile')}
            color={getScreenSizeButtonColor('mobile')}
          >
            <MobileScreenShareIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Tablet view">
          <IconButton
            aria-label="tablet view"
            onClick={() => appPreviewStore.setKey('screenSize', 'tablet')}
            color={getScreenSizeButtonColor('tablet')}
          >
            <TabletIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Desktop view">
          <IconButton
            aria-label="desktop view"
            onClick={() => appPreviewStore.setKey('screenSize', 'desktop')}
            color={getScreenSizeButtonColor('desktop')}
          >
            <LaptopIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Settings">
          <IconButton
            aria-label="settings"
            onClick={handleSettingsClick}
            color={openSettings ? 'primary' : 'inherit'}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={settingsAnchorEl}
          open={openSettings}
          onClose={handleSettingsClose}
          MenuListProps={{
            'aria-labelledby': 'settings-button',
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={handleSettingsClose} sx={{ py: 0.5 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={useProxy}
                  onChange={handleToggleProxy}
                  name="useProxy"
                  color="primary"
                  size="small"
                />
              }
              label="Use Proxy"
              sx={{ mr: 1 }}
            />
          </MenuItem>
        </Menu>
      </Box>
    </Paper>
  );
};

export default BrowserAppToolbar;
