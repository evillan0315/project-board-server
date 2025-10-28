import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  llmStore,
  clearDiff,
  setLastLlmResponse,
  setRequestType,
  setLlmOutputFormat,
  setInstruction,
} from '@/stores/llmStore';
import { setError } from '@/stores/errorStore';
import { addLog } from '@/stores/logStore';
import {
  isTerminalVisible,
  setShowTerminal,
} from '@/components/Terminal/stores/terminalStore';
import { projectRootDirectoryStore } from '@/stores/fileTreeStore';
import { fileStore, setUploadedFile, openedTabs } from '@/stores/fileStore';

import {
  Box,
  Typography,
  Alert,
  useTheme,
  LinearProgress,
} from '@mui/material';

import OpenedFileViewer from '@/components/OpenedFileViewer';
import FileTabs from '@/components/FileTabs';
import { RequestType, LlmOutputFormat } from '@/types/llm';
import { rightSidebarContent } from '@/stores/uiStore';
import { XTerminal } from '@/components/Terminal/Terminal';
import { handleLogout } from '@/services/authService';
import LlmGenerationContent from '@/components/LlmGenerationContent';

const FILE_TREE_WIDTH = 300;
const FILE_TABS_HEIGHT = 48;
const RESIZE_HANDLE_HEIGHT = 2;

const AiEditorPage: React.FC = () => {
  const $rightSidebarContent = useStore(rightSidebarContent);
  const currentProjectPath = useStore(projectRootDirectoryStore);
  const $openedTabs = useStore(openedTabs);
  const {
    error: globalError,
    lastLlmResponse,
    loading,
    applyingChanges,
    isBuilding,
    requestType,
    llmOutputFormat,
  } = useStore(llmStore);

  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const [showFileTree, setShowFileTree] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [initialMouseY, setInitialMouseY] = useState(0);
  const [initialTerminalHeight, setInitialTerminalHeight] = useState(0);

  const contentAreaRef = useRef<HTMLDivElement>(null);
  const showTerminal = useStore(isTerminalVisible);
  const navigate = useNavigate();

  const isAIGeneratingOrModifying = loading || isBuilding;

  // Clear diff on response/project change
  useEffect(() => {
    clearDiff();
  }, [lastLlmResponse, currentProjectPath]);

  // Update requestType and llmOutputFormat from URL
  useEffect(() => {
    const requestTypeParam = searchParams.get('requestType');
    const outputFormatParam = searchParams.get('output');

    if (
      requestTypeParam &&
      RequestType[requestTypeParam as keyof typeof RequestType]
    ) {
      const newRequestType =
        RequestType[requestTypeParam as keyof typeof RequestType];
      if (requestType !== newRequestType) {
        setRequestType(newRequestType);
        setInstruction('');
        setUploadedFile(null, null, null);
        setLastLlmResponse(null);
        addLog(
          'AI Editor Page',
          `Request type set from URL: ${newRequestType}`,
          'info',
        );
      }
    } else if (requestType !== RequestType.LLM_GENERATION) {
      setRequestType(RequestType.LLM_GENERATION);
      addLog(
        'AI Editor Page',
        `Defaulting request type to LLM_GENERATION`,
        'info',
      );
    }

    if (
      outputFormatParam &&
      LlmOutputFormat[outputFormatParam as keyof typeof LlmOutputFormat]
    ) {
      const newLlmOutputFormat =
        LlmOutputFormat[outputFormatParam as keyof typeof LlmOutputFormat];
      if (llmOutputFormat !== newLlmOutputFormat) {
        setLlmOutputFormat(newLlmOutputFormat);
        addLog(
          'AI Editor Page',
          `Output format set from URL: ${newLlmOutputFormat}`,
          'info',
        );
      }
    } else if (llmOutputFormat !== LlmOutputFormat.YAML) {
      setLlmOutputFormat(LlmOutputFormat.YAML);
      addLog('AI Editor Page', `Defaulting output format to YAML`, 'info');
    }
  }, [searchParams, requestType, llmOutputFormat]);

  // Terminal resize handlers
  const startResize = useCallback(
    (e: React.MouseEvent) => {
      setIsResizing(true);
      setInitialMouseY(e.clientY);
      setInitialTerminalHeight(terminalHeight);
      document.body.style.cursor = 'ns-resize';
    },
    [terminalHeight],
  );

  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaY = e.clientY - initialMouseY;
      let newHeight = initialTerminalHeight - deltaY;

      const MIN_TERMINAL_HEIGHT = 30;
      const MIN_VIEWER_HEIGHT = 150;
      const totalResizableHeight = contentAreaRef.current?.clientHeight || 0;
      const maxPossibleTerminalHeight = Math.max(
        0,
        totalResizableHeight - MIN_VIEWER_HEIGHT - RESIZE_HANDLE_HEIGHT,
      );

      newHeight = Math.max(
        MIN_TERMINAL_HEIGHT,
        Math.min(newHeight, maxPossibleTerminalHeight),
      );
      setTerminalHeight(newHeight);
    },
    [isResizing, initialMouseY, initialTerminalHeight],
  );

  const stopResize = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = 'default';
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResize);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResize);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [isResizing, resize, stopResize]);

  const handleTerminalLogout = useCallback(async () => {
    try {
      await handleLogout();
      navigate('/login');
      addLog('Terminal', 'User logged out successfully via terminal.', 'info');
    } catch (error) {
      console.error('Failed to log out from terminal:', error);
      setError('Failed to log out from terminal.');
      addLog('Terminal', `Failed to log out from terminal: ${error}`, 'error');
    }
  }, [navigate]);

  const handleTerminalResize = useCallback(() => {
    const cols = Math.floor(window.innerWidth / 10);
    const rows = Math.floor(terminalHeight / 20);
  }, [terminalHeight]);

  useEffect(() => {
    window.addEventListener('resize', handleTerminalResize);
    handleTerminalResize();
    return () => {
      window.removeEventListener('resize', handleTerminalResize);
    };
  }, [handleTerminalResize]);

  const toggleTerminalVisibility = () => setShowTerminal(!showTerminal);

  useEffect(() => {
    rightSidebarContent.set(<LlmGenerationContent />);
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        color: theme.palette.text.primary,
        overflow: 'hidden',
      }}
    >
      {globalError && (
        <Alert
          severity="error"
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1100,
            borderRadius: 0,
            flexShrink: 0,
          }}
        >
          <Typography variant="body2">{String(globalError)}</Typography>
        </Alert>
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          flexGrow: 1,
          width: '100%',
          minHeight: 0,
          position: 'relative',
        }}
      >
        {/* Main Editor */}
        <Box
          sx={{
            flexGrow: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            bgcolor: theme.palette.background.paper,
          }}
        >
          {$openedTabs && $openedTabs.length > 0 && (
            <FileTabs sx={{ flexShrink: 0, height: FILE_TABS_HEIGHT }} />
          )}

          <Box
            ref={contentAreaRef}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ flexGrow: 1, minHeight: '150px', overflow: 'auto' }}>
              <OpenedFileViewer />
            </Box>

            {showTerminal && (
              <>
                <Box
                  onMouseDown={startResize}
                  sx={{
                    height: RESIZE_HANDLE_HEIGHT,
                    bgcolor: theme.palette.background.default,
                    borderTop: `1px solid ${theme.palette.divider}`,
                    cursor: 'ns-resize',
                    flexShrink: 0,
                    '&:hover': { bgcolor: theme.palette.primary.main },
                  }}
                />
                <Box
                  sx={{
                    height: terminalHeight,
                    minHeight: '50px',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  <XTerminal
                    onLogout={handleTerminalLogout}
                    terminalHeight={terminalHeight}
                  />
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AiEditorPage;
