/**
 * FilePath: src/components/terminal/XTerminal.tsx
 * Title: React XTerm Terminal Component (WebGL + Clipboard Support)
 * Reason: Integrate @xterm/xterm with @xterm/addon-webgl for GPU rendering and
 *         @xterm/addon-clipboard for native copy-paste functionality.
 *         Refactored to use a dedicated terminalSocketService for socket communication
 *         and terminalStore for state management. XTerminal now owns the XTerm.js instance
 *         and handles direct writing of output, while updating the store with plain text.
 *         FIX: Updated input handling to correctly forward arrow keys and control
 *         characters to the backend PTY, enabling interactive prompts and shell history.
 *         FIX: Enabled full copy/paste by correctly utilizing ClipboardAddon and term.onData.
 *         MOD: Removed `terminalHeight` prop in favor of `ResizeObserver` for dynamic sizing.
 *         MOD: Added `onCloseDrawer` prop to align `TerminalToolbar`'s close behavior with parent drawer.
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
  connectTerminal, // Use store's connect/disconnect orchestrators
  disconnectTerminal,
  appendOutput, // Used by XTerminal to update store with plain text
  setSystemInfo, // Used by XTerminal to update store with system info
  setCurrentPath, // Used by XTerminal to update store with current path
  setConnected, // Used by XTerminal for immediate state update from socket events
} from '@/components/Terminal/stores/terminalStore';
import { terminalSocketService } from '@/components/Terminal/services/terminalSocketService'; // NEW: Use specific terminal socket service
import { handleLogout } from '@/services/authService';
import { themeStore } from '@/stores/themeStore';
import stripAnsi from 'strip-ansi'; // Needed for plain text conversion
import { SystemInfo, PromptData } from './types/terminal'; // For type safety

interface XTerminalProps {
  onLogout: () => void;
  onCloseDrawer?: () => void; // NEW: Callback to close a parent drawer/modal
}

export const XTerminal: React.FC<XTerminalProps> = ({
  onLogout,
  onCloseDrawer,
}) => {
  const { isConnected } = useStore(terminalStore);
  const navigate = useNavigate();
  const { mode } = useStore(themeStore);
  const theme = useTheme();

  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [open, setOpen] = useState(false); // State for TerminalSettingsDialog

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

        // The initial 'Project Terminal Ready' message and prompt are now handled by
        // connectTerminal/appendOutput and the PTY itself, respectively.
        // The frontend no longer manages a local command buffer or writes a '$ ' prompt.

        // ──────────────────────────────────────────────
        // Input Handling: Use onData for all raw input (characters, pastes)
        // and onKey for specific control sequences.
        // ──────────────────────────────────────────────
        term.onData((data) => {
          terminalSocketService.sendInput(data);
        });

        term.onKey(({ domEvent }) => {
          // Prevent default browser behavior for keys we handle to avoid conflicts
          if (
            domEvent.key === 'Tab' ||
            domEvent.key === 'Enter' ||
            domEvent.key === 'Backspace' ||
            domEvent.key.startsWith('Arrow') ||
            (domEvent.ctrlKey && domEvent.key.toLowerCase() === 'c')
          ) {
            domEvent.preventDefault();
          }

          // ClipboardAddon automatically handles Ctrl+C (copy selection) and Ctrl+V (paste).
          // Pasted text from ClipboardAddon will flow through term.onData.
          // We only need to handle explicit control sequences here.

          if (domEvent.key === 'Enter') {
            terminalSocketService.sendInput('\r'); // Send Carriage Return to PTY
          } else if (domEvent.key === 'Backspace') {
            terminalSocketService.sendInput('\x7F'); // Send ASCII DELETE to PTY
          } else if (domEvent.key === 'Tab') {
            terminalSocketService.sendInput('\t'); // Send Tab to PTY
          } else if (domEvent.key === 'ArrowUp') {
            terminalSocketService.sendInput('\x1b[A'); // ANSI escape for ArrowUp
          } else if (domEvent.key === 'ArrowDown') {
            terminalSocketService.sendInput('\x1b[B'); // ANSI escape for ArrowDown
          } else if (domEvent.key === 'ArrowLeft') {
            terminalSocketService.sendInput('\x1b[D'); // ANSI escape for ArrowLeft
          } else if (domEvent.key === 'ArrowRight') {
            terminalSocketService.sendInput('\x1b[C'); // ANSI escape for ArrowRight
          } else if (domEvent.ctrlKey && domEvent.key.toLowerCase() === 'c') {
            // If no text is selected, Ctrl+C should act as an interrupt.
            // ClipboardAddon handles copying selected text automatically.
            if (!term.hasSelection()) {
              terminalSocketService.sendInput('\x03'); // ASCII for Ctrl+C (ETX) for interrupt
            }
          }
          // All other printable characters are automatically captured by term.onData
          // and sent to the backend. We do not need a 'default' case here.
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
  // ResizeObserver for dynamic fitting
  // ──────────────────────────────────────────────
  useEffect(() => {
    const container = terminalContainerRef.current;
    const fitAddon = fitAddonRef.current;

    if (!container || !fitAddon) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === container) {
          try {
            fitAddon.fit();
          } catch (err) {
            console.warn('[XTerminal] Fit on resize skipped:', err);
          }
        }
      }
    });

    observer.observe(container);

    return () => {
      observer.unobserve(container);
      observer.disconnect();
    };
  }, []);

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
      // Update CWD in store. PTY itself will print the prompt via `handleOutput`.
      setCurrentPath(data.cwd);
    };

    // Listeners for internal connection/disconnection state changes of the underlying socket
    // These update the global `isConnected` state directly and write messages to XTerm
    const handleSocketConnect = () => {
      setConnected(true);
    };

    const handleSocketDisconnect = (reason: string) => {
      setConnected(false);
    };

    const handleSocketConnectError = (error: Error) => {
      setConnected(false);
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
  // Context menu for copy/paste functionality
  // The ClipboardAddon provides native context menu copy/paste automatically.
  // Removing custom contextmenu handler.
  // ──────────────────────────────────────────────

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────
  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%', // Take full height of parent container
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
        onCloseDrawer={onCloseDrawer} // NEW: Pass the drawer close handler
        sx={{ position: 'sticky', top: 0, zIndex: 1 }}
      />

      <Box
        ref={terminalContainerRef}
        sx={{
          flexGrow: 1, // This will make it take all available vertical space
          overflow: 'hidden',
          '.xterm': { padding: '8px' }, // Padding inside the terminal view
        }}
      />

      <TerminalSettingsDialog open={open} onClose={() => setOpen(false)} />
    </Paper>
  );
};
