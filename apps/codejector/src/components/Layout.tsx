// Source: src/components/Layout.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';

import { checkAuthStatus } from '@/services/authService';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import { llmStore } from '@/stores/llmStore';
import {
  isRightSidebarVisible,
  isLeftSidebarVisible,
  rightSidebarWidth,
  leftSidebarWidth,
} from '@/stores/uiStore';
import Navbar from './Navbar';
import { fileStore } from '@/stores/fileStore';
import { $mediaStore } from '@/stores/mediaStore';
import FileTree from '@/components/file-tree/FileTree';

import OpenedFileViewer from './OpenedFileViewer';
import AiEditorNoTreePage from '@/components/file-manager/AiEditorNoTreePage';
import LlmGenerationContent from './LlmGenerationContent';
import Footer from './Footer';

// ✅ NEW: import global loading store
import { loadingStore } from '@/stores/loadingStore';
import { currentURL } from '@/stores/page';

const NAVBAR_HEIGHT = 64;
const FOOTER_HEIGHT = 50; // Adjusted to accommodate both original footer controls (40px) and MediaPlayerContainer (80px)

const MIN_SIDEBAR_WIDTH = 300;
const MAX_SIDEBAR_WIDTH = 1000;
const SIDEBAR_RESIZER_WIDTH = 2;

interface LayoutProps {
  footer?: React.ReactNode | null;
}

const Layout: React.FC<LayoutProps> = ({ footer }) => {
  const { loading: authLoading, isLoggedIn } = useStore(authStore);
  const { loading: llmLoading, isBuilding } = useStore(llmStore);
  const { loading: mediaLoading } = useStore($mediaStore);

  const { openedFile } = useStore(fileStore);

  // ✅ subscribe to global loading store
  const globalLoadingState = useStore(loadingStore);

  const theme = useTheme();

  // ✅ consider both existing loaders and global request loaders
  const isAnyGlobalRequestLoading =
    Object.values(globalLoadingState).some(Boolean);
  const layoutLoader =
    authLoading ||
    llmLoading ||
    isBuilding ||
    isAnyGlobalRequestLoading ||
    mediaLoading;

  const $isRightSidebarVisible = useStore(isRightSidebarVisible);
  const $isLeftSidebarVisible = useStore(isLeftSidebarVisible);
  const $rightSidebarWidth = useStore(rightSidebarWidth);
  const $leftSidebarWidth = useStore(leftSidebarWidth);

  // Resizing state
  const [isResizing, setIsResizing] = useState<null | 'left' | 'right'>(null);
  const initialMouseX = useRef(0);
  const initialSidebarWidth = useRef(0);

  const location = useLocation();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    currentURL.set(location.pathname);
  }, [location.pathname]);

  /** Start resizing a sidebar */
  const startResizing = (side: 'left' | 'right') => (e: React.MouseEvent) => {
    setIsResizing(side);
    initialMouseX.current = e.clientX;
    initialSidebarWidth.current =
      side === 'left' ? $leftSidebarWidth : $rightSidebarWidth;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    document.body.style.pointerEvents = 'none';
  };

  const stopResizing = useCallback(() => {
    if (isResizing) {
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      document.body.style.pointerEvents = 'auto';
      setIsResizing(null);
    }
  }, [isResizing]);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaX = e.clientX - initialMouseX.current;
      if (isResizing === 'left') {
        let newWidth = initialSidebarWidth.current + deltaX;
        newWidth = Math.max(
          MIN_SIDEBAR_WIDTH,
          Math.min(MAX_SIDEBAR_WIDTH, newWidth),
        );
        leftSidebarWidth.set(newWidth);
      } else {
        let newWidth = initialSidebarWidth.current - deltaX;
        newWidth = Math.max(
          MIN_SIDEBAR_WIDTH,
          Math.min(MAX_SIDEBAR_WIDTH, newWidth),
        );
        rightSidebarWidth.set(newWidth);
      }
    },
    [isResizing],
  );

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResizing);
    } else {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <Paper
      className="h-screen flex flex-col overflow-hidden"
      sx={{ backgroundColor: theme.palette.background.default }}
    >
      <Navbar />

      {/* ✅ now also shows when global loadingStore has any active request */}

      {layoutLoader && (
        <Box className="w-full fixed top-18 z-[1100] flex-shrink-0">
          <LinearProgress />
        </Box>
      )}

      {/* Main content + optional sidebars */}
      <Box
        className="flex-grow w-full flex flex-row overflow-hidden"
        sx={{
          height: `calc(100vh - ${NAVBAR_HEIGHT}px - ${FOOTER_HEIGHT}px)`,
        }}
      >
        {/* Left sidebar */}
        {isLoggedIn && $isLeftSidebarVisible && (
          <>
            <Box
              className="flex-shrink-0 overflow-auto flex flex-col border-r"
              sx={{
                width: $leftSidebarWidth,
                backgroundColor: theme.palette.background.paper,
                borderColor: theme.palette.divider,
              }}
            >
              <FileTree />
            </Box>
            {/* Draggable resizer */}
            <Box
              onMouseDown={startResizing('left')}
              className="flex-shrink-0 cursor-ew-resize z-10"
              sx={{
                width: SIDEBAR_RESIZER_WIDTH,
                backgroundColor: theme.palette.divider,
                transition: 'background-color 0.2s ease',
                bgcolor: theme.palette.background.dark,
                '&:hover': {
                  backgroundColor: theme.palette.primary.main,
                },
              }}
              title="Resize sidebar"
            />
          </>
        )}

        {/* Main Outlet content */}
        <Box
          className="flex-grow flex flex-col overflow-auto min-w-0 pb-[0px]"
          sx={{ backgroundColor: theme.palette.background.paper }}
        >
          {openedFile ? <AiEditorNoTreePage /> : <Outlet />}
        </Box>

        {/* Right sidebar */}
        {isLoggedIn && $isRightSidebarVisible && (
          <>
            {/* Draggable resizer */}
            <Box
              onMouseDown={startResizing('right')}
              className="flex-shrink-0 cursor-ew-resize z-10"
              sx={{
                width: SIDEBAR_RESIZER_WIDTH,
                backgroundColor: theme.palette.divider,
                bgcolor: theme.palette.background.dark,
                transition: 'background-color 0.2s ease',
                '&:hover': {
                  backgroundColor: theme.palette.primary.main,
                },
              }}
              title="Resize sidebar"
            />
            <Box
              className="flex-shrink-0 overflow-auto flex flex-col border-l pb-0"
              sx={{
                width: $rightSidebarWidth,
                backgroundColor: theme.palette.background.paper,
                borderColor: theme.palette.divider,
              }}
            >
              <LlmGenerationContent />
            </Box>
          </>
        )}
      </Box>

      {/* Sticky footer */}
      <Paper
        elevation={1}
        className="sticky bottom-0 z-[300] w-full flex flex-col justify-center items-center border-t radius-0" // Changed to flex-col
        sx={{
          height: FOOTER_HEIGHT,
          backgroundColor: theme.palette.background.paper,
          borderColor: theme.palette.divider,
        }}
      >
        <Footer />
      </Paper>
    </Paper>
  );
};

export default Layout;
