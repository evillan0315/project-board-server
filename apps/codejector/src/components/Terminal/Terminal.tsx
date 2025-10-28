/**
 * FilePath: src/components/terminal/XTerminal.tsx
 * Title: React XTerm Terminal Component (WebGL + Clipboard Support)
 * Reason: Integrate @xterm/xterm with @xterm/addon-webgl for GPU rendering and
 *         @xterm/addon-clipboard for native copy-paste functionality.
 *         Refactored to use a dedicated terminalSocketService for socket communication
 *         and terminalStore for state management. XTerminal now owns the XTerm.js instance
 *         and handles direct writing of output, while updating the store with plain text.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, useTheme } from '@mui/material';
import { useStore } from '@nanostores/react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { ClipboardAddon } from '@xterm/addon-clipboard';
import '@xterm/xterm/css/xterm.css';
import { getToken } from '@/stores/authStore';
import { TerminalToolbar } from './TerminalToolbar';
import TerminalSettingsDialog from './TerminalSettingsDialog';
import {
  terminalStore,
  connectTerminal,       // Use store's connect/disconnect orchestrators
  disconnectTerminal,
  executeCommand,
  appendOutput,          // Used by XTerminal to update store with plain text
  setSystemInfo,         // Used by XTerminal to update store with system info
  setCurrentPath,        // Used by XTerminal to update store with current path
  setConnected,          // Used by XTerminal for immediate state update from socket events
} from '@/components/Terminal/stores/terminalStore';
import { terminalSocketService } from '@/components/Terminal/services/terminalSocketService'; // NEW: Use specific terminal socket service
import { handleLogout } from '@/services/authService';
import { themeStore } from '@/stores/themeStore';
import stripAnsi from 'strip-ansi'; // Needed for plain text conversion
import { SystemInfo, PromptData } from './types/terminal'; // For type safety

interface XTerminalProps {
  onLogout: () => void;
  terminalHeight: number;
}

export const XTerminal: React.FC<XTerminalProps> = ({
  onLogout,
  terminalHeight,
}) => {
  const { isConnected } = useStore(terminalStore);
  const navigate = useNavigate();
  const { mode } = useStore(themeStore);
  const theme = useTheme();

  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [open, setOpen] = useState(false);

  // ──────────────────────────────────────────────
  // Initialize terminal with WebGL + Clipboard
  // ──────────────────────────────────────────────
  useEffect(() => {
    const container = terminalContainerRef.current;
    if (!container) return;

    const term = new Terminal({
      allowProposedApi: true,
      cursorBlink: true,
      fontFamily: '"Fira Code", monospace',
      fontSize: 13,
      convertEol: true,
      scrollback: 3000,
      theme:
        mode === 'dark'
          ? {
              background: '#1e1e1e',
              foreground: '#d4d4d4',
              cursor: '#4ec9b0',
              selectionBackground: '#264f78',
            }
          : {
              background: '#fafafa',
              foreground: '#000000',
              cursor: '#007acc',
              selectionBackground: '#cce5ff',
            },
    });

    const fitAddon = new FitAddon();
    const clipboardAddon = new ClipboardAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(clipboardAddon);

    const waitForContainerReady = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        term.open(container);

        try {
          const webglAddon = new WebglAddon();
          term.loadAddon(webglAddon);
          console.log('[XTerminal] WebGL renderer enabled.');
        } catch (err) {
          console.warn('[XTerminal] WebGL not available:', err);
        }

        setTimeout(() => {
          try {
            fitAddon.fit();
          } catch (err) {
            console.warn('[XTerminal] Fit skipped:', err);
          }
        }, 100);

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // The initial 'Project Terminal Ready' message is now handled by connectTerminal/appendOutput
        // The prompt is also handled by socket events and terminalStore state updates
        // term.writeln('\x1b[36mProject Terminal Ready\x1b[0m');
        // term.writeln('---------------------------------------');
        // term.write('$ ');

        // ──────────────────────────────────────────────
        // Input Handling + Command History (local to XTerminal) and sending commands
        // ──────────────────────────────────────────────
        let commandBuffer = '';
        const history: string[] = [];
        let historyIndex = -1;

        const redrawCommandLine = (currentTerm: Terminal, buffer: string) => {
            // Clear current line after '$ '
            currentTerm.write('\x1b[2K\r$ ' + buffer);
        };

        term.onKey(({ key, domEvent }) => {
          const { key: pressedKey, ctrlKey } = domEvent;

          // Handle Ctrl+C for copy (if selection) or interrupt (if no selection)
          if (ctrlKey && pressedKey.toLowerCase() === 'c') {
            if (term.hasSelection()) {
              navigator.clipboard.writeText(term.getSelection() ?? '').catch(() => {});
              term.clearSelection();
            } else {
              // If no selection, send Ctrl+C to terminal (interrupt)
              terminalSocketService.sendInput('\x03'); // ASCII for Ctrl+C
            }
            return;
          }

          // Handle Ctrl+V for paste
          if (ctrlKey && pressedKey.toLowerCase() === 'v') {
            navigator.clipboard
              .readText()
              .then((clipText) => {
                if (clipText) {
                  commandBuffer += clipText;
                  term.write(clipText);
                }
              })
              .catch(() => {});
            return;
          }

          switch (pressedKey) {
            case 'Enter':
              term.write('\r\n'); // Display newline in terminal
              const trimmed = commandBuffer.trim();
              if (trimmed.length > 0) {
                executeCommand(trimmed); // Use store action to send command via service
                history.unshift(trimmed); // Add to local history
              }
              commandBuffer = '';
              historyIndex = -1;
              term.write('$ '); // Display prompt immediately for responsiveness
              break;

            case 'Backspace':
              if (commandBuffer.length > 0) {
                commandBuffer = commandBuffer.slice(0, -1);
                term.write('\b \b'); // Erase character in terminal: backspace, space, backspace
              }
              break;

            case 'ArrowUp':
              if (history.length > 0 && historyIndex < history.length - 1) {
                historyIndex++;
                commandBuffer = history[historyIndex];
                redrawCommandLine(term, commandBuffer);
              }
              break;

            case 'ArrowDown':
              if (historyIndex > 0) {
                historyIndex--;
                commandBuffer = history[historyIndex];
              } else {
                historyIndex = -1;
                commandBuffer = '';
              }
              redrawCommandLine(term, commandBuffer);
              break;

            case 'Tab':
              // Basic tab handling, actual completion would require backend interaction
              commandBuffer += '\t';
              term.write('  '); // Simulate tab space in terminal for visual feedback
              break;

            default:
              // Only process single characters that are not control characters
              if (pressedKey.length === 1 && !ctrlKey) {
                commandBuffer += pressedKey;
                term.write(pressedKey);
              }
              break;
          }
        });

      } else {
        requestAnimationFrame(waitForContainerReady);
      }
    };

    waitForContainerReady();

    // Cleanup XTerm.js instance on component unmount
    return () => {
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, [mode]); // Re-run if theme mode changes to update terminal theme

  // ──────────────────────────────────────────────
  // Socket Event Handling (via terminalSocketService)
  // This useEffect attaches listeners to the terminalSocketService
  // and updates both the XTerm.js instance and the nanostore.
  // ──────────────────────────────────────────────
  useEffect(() => {
    const term = xtermRef.current;
    if (!term) return;

    // Handlers that write to the XTerm.js instance and update the global terminalStore
    const handleOutput = (data: string) => {
      term.write(data);
      appendOutput(stripAnsi(data)); // Update nanostore with plain text version
    };

    const handleError = (data: string) => {
      term.writeln(`\r\n\x1b[31mError:\x1b[0m ${data}`);
      appendOutput(`Error: ${stripAnsi(data)}`); // Update nanostore
    };

    const handleOutputInfo = (data: SystemInfo) => {
      const formatted = Object.entries(data)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
      term.writeln(formatted);
      setSystemInfo(`${formatted}\n`); // Update nanostore
    };

    const handlePrompt = (data: PromptData) => {
      setCurrentPath(data.cwd); // Update nanostore
      // No direct write to term here, terminal will eventually show the prompt
    };

    // Listeners for internal connection/disconnection state changes of the underlying socket
    // These update the global `isConnected` state directly and write messages to XTerm
    const handleSocketConnect = () => {
      setConnected(true);
      // Initial connection messages are now handled by terminalStore.connectTerminal
      // and XTerminal's initial setup. No need to re-write on every socket reconnect.
    };

    const handleSocketDisconnect = (reason: string) => {
      setConnected(false);
      // Disconnection messages are handled by terminalStore.disconnectTerminal
    };

    const handleSocketConnectError = (error: Error) => {
      setConnected(false);
      // Connection error messages are handled by terminalStore.connectTerminal
    };

    // Attach listeners to the terminalSocketService instance
    terminalSocketService.on('output', handleOutput);
    terminalSocketService.on('outputMessage', handleOutput); // Also listen for 'outputMessage' for consistency
    terminalSocketService.on('error', handleError);
    terminalSocketService.on('outputInfo', handleOutputInfo);
    terminalSocketService.on('prompt', handlePrompt);

    // Listen to raw socket connect/disconnect events for direct state updates
    terminalSocketService.on('connect', handleSocketConnect);
    terminalSocketService.on('disconnect', handleSocketDisconnect);
    terminalSocketService.on('connect_error', handleSocketConnectError);

    // Cleanup: Remove all listeners when component unmounts or dependencies change
    return () => {
      terminalSocketService.off('output', handleOutput);
      terminalSocketService.off('outputMessage', handleOutput);
      terminalSocketService.off('error', handleError);
      terminalSocketService.off('outputInfo', handleOutputInfo);
      terminalSocketService.off('prompt', handlePrompt);
      terminalSocketService.off('connect', handleSocketConnect);
      terminalSocketService.off('disconnect', handleSocketDisconnect);
      terminalSocketService.off('connect_error', handleSocketConnectError);
    };
  }, []); // Empty dependency array ensures these listeners are set up once on mount

  // ──────────────────────────────────────────────
  // Auto-connect on mount and handle disconnect on unmount
  // Uses the orchestrating actions from terminalStore.
  // ──────────────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) {
        // If no token, ensure disconnected state and prevent connection attempt
        setConnected(false);
        console.warn('No authentication token available for terminal. Skipping auto-connect.');
        return;
    }

    // Attempt to connect using the terminalStore action, which handles connection logic
    connectTerminal().catch(async (error) => {
      console.error('Initial terminal connection failed:', error);
      // Specific error message check for authentication token issues
      if (error instanceof Error && error.message === 'No authentication token.') {
        await handleLogout();
        navigate('/login');
      }
    });

    // Cleanup: Disconnect terminal when component unmounts
    return () => {
      disconnectTerminal();
    };
  }, []); // Empty dependency array ensures this effect runs once on mount/unmount

  // ──────────────────────────────────────────────
  // Dynamic height refit for XTerm.js instance
  // ──────────────────────────────────────────────
  useEffect(() => {
    // RequestAnimationFrame ensures refit happens after DOM layout is stable
    requestAnimationFrame(() => {
      try {
        fitAddonRef.current?.fit();
      } catch {
        /* Ignore errors if renderer is not yet ready, common during rapid updates */
      }
    });
  }, [terminalHeight]); // Re-fit whenever the provided terminalHeight changes

  // ──────────────────────────────────────────────
  // Context menu for copy/paste functionality
  // ──────────────────────────────────────────────
  useEffect(() => {
  const container = terminalContainerRef.current;
  const term = xtermRef.current;
  if (!container || !term) return;

  const handleContextMenu = async (event: MouseEvent) => {
    event.preventDefault(); // Prevent default browser context menu
    if (term.hasSelection()) {
      // If text is selected, copy it to clipboard
      const selectedText = term.getSelection();
      await navigator.clipboard.writeText(selectedText);
      term.clearSelection(); // Clear selection after copying
    } else {
      // If no text selected, paste from clipboard
      const text = await navigator.clipboard.readText();
      term.paste(text); // Paste directly into XTerm.js
    }
  };

  container.addEventListener('contextmenu', handleContextMenu);
  return () => container.removeEventListener('contextmenu', handleContextMenu);
}, []); // Empty dependency array ensures this runs once on mount/unmount
  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────
  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        border: 0,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor:
          mode === 'dark'
            ? theme.palette.background.paper
            : theme.palette.background.default,
      }}
    >
      <TerminalToolbar
        isConnected={isConnected}
        currentPath="" // `currentPath` is retrieved from `terminalStore` if needed, not passed directly via prop if not used
        onConnect={connectTerminal}    // Use store's connect action for consistency
        onDisconnect={disconnectTerminal} // Use store's disconnect action for consistency
        onSettings={() => setOpen(true)}
        onLogout={onLogout}
        sx={{ position: 'sticky', top: 0, zIndex: 1 }} // Keeps toolbar at top on scroll
      />

      <Box
        ref={terminalContainerRef}
        // onClick={() => terminalContainerRef.current?.focus()} // XTerm handles its own focus logic internally
        sx={{
          flexGrow: 1,
          height: `${terminalHeight}px`, // Dynamic height based on prop
          overflow: 'hidden',
          '.xterm': { padding: '8px' }, // Padding inside the terminal view
        }}
      />

      <TerminalSettingsDialog open={open} onClose={() => setOpen(false)} />
    </Paper>
  );
};
