import React, { useState, ReactNode } from 'react';
import {
  Drawer,
  Box,
  IconButton,
  Typography,
  useTheme,
  Slide,
  Zoom,
  Dialog,
  DialogContent,
  AppBar,
  Toolbar,
  Paper,
  DialogActions
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useStore } from '@nanostores/react';
import { themeStore } from '@/stores/themeStore';
import { GlobalAction } from '@/types';
import GlobalActionButton from '@/components/ui/GlobalActionButton';

// Define the types for the drawer
interface CustomDrawerProps {
  open: boolean;
  onClose: () => void;
  position: 'left' | 'right' | 'top' | 'bottom';
  size: 'normal' | 'medium' | 'large' | 'fullscreen';
  hasBackdrop?: boolean;
  closeOnEscape?: boolean;
  stickyHeader?: ReactNode;
  footerActionButton?: GlobalAction[];
  children: ReactNode;
  title?: string;
}

const drawerWidthPercentage: Record<CustomDrawerProps['size'], number> = {
  normal: 1 / 3,
  medium: 1 / 2,
  large: 3 / 4,
  fullscreen: 1,
};

// Drawer component
const CustomDrawer: React.FC<CustomDrawerProps> = ({
  open,
  onClose,
  position,
  size = 'medium',
  hasBackdrop = false,
  closeOnEscape = true,
  stickyHeader,
  footerActionButton,
  children,
  title,
}) => {
  const theme = useTheme();
  const { mode } = useStore(themeStore);
  const drawerWidth = `${drawerWidthPercentage[size] * 100}%`;
  const isFullScreen = size === 'fullscreen';

  // Styles for the drawer based on the position
  const drawerPaperStyle = {
    ...(position === 'left' || position === 'right'
      ? { width: isFullScreen ? '100%' : drawerWidth }
      : { height: isFullScreen ? '100%' : drawerWidth }),
    bgcolor: theme.palette.background.default,
    border: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.primary,
    overflow: 'auto',
  };

  const backdrop = hasBackdrop ? true : false;
  const closeOnKey = closeOnEscape ? undefined : 'escapeKeyDown';

  const container = isFullScreen ? Dialog : Slide;

  return (
    <Drawer
      anchor={position}
      open={open}
      onClose={onClose}
      hideBackdrop={backdrop}
      sx={{
        ...(position === 'left' || position === 'right'
          ? { width: isFullScreen ? '100%' : drawerWidth }
          : { height: isFullScreen ? '100%' : drawerWidth }),
      }}
      PaperProps={{ sx: drawerPaperStyle }}
    >
      {isFullScreen ? (
        <DialogContent>
          <AppBar sx={{ position: 'relative' }}>
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={onClose}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                {title}
              </Typography>
            </Toolbar>
          </AppBar>
          <Box sx={{ p: 2 }}>{children}</Box>
        </DialogContent>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          {stickyHeader && (
            <Box
              sx={{
                p: 2,
                bgcolor: theme.palette.background.default,
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {stickyHeader}
              <IconButton
                edge="end"
                color="inherit"
                onClick={onClose}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          )}
          {title && (
            <Box
              sx={{
                p: 2,
                bgcolor: theme.palette.background.default,
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="h6" component="div">
                {title}
              </Typography>
              <IconButton
                edge="end"
                color="inherit"
                onClick={onClose}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          )}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
            }}
          >
            {children}
          </Box>
          {footerActionButton && (
            <DialogActions sx={{
                p: 2,
                bgcolor: theme.palette.background.default,
                borderTop: `1px solid ${theme.palette.divider}`,
                justifyContent: `${position === 'left' ? 'flex-end' : 'flex-start' }`,
              }}>

              <GlobalActionButton globalActions={footerActionButton} />
            </DialogActions>
          )}
        </Box>
      )}
    </Drawer>
  );
};

export default CustomDrawer;
