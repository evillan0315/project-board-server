/**
 * FilePath: src/components/terminal/XTerminal.tsx
 * Title: React XTerm Terminal Component (WebGL + Clipboard Support)
 * Reason: Integrate @xterm/xterm with @xterm/addon-webgl for GPU rendering and
 *         @xterm/addon-clipboard for native copy-paste functionality.
 */

import React, { useEffect, useRef, useState } from 'react';
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
  connectTerminal,
  disconnectTerminal,
  executeCommand,
  resizeTerminal,
  appendOutput,
} from '@/components/Terminal/stores/terminalStore';
import { socketService } from '@/services/socketService';
import { handleLogout } from '@/services/authService';
import { themeStore } from '@/stores/themeStore';

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

        term.writeln('\x1b[36mProject Terminal Ready\x1b[0m');
        term.writeln('---------------------------------------');
        term.write('$ ');

        // ──────────────────────────────────────────────
        // Input Handling + Command History
        // ──────────────────────────────────────────────
        let commandBuffer = '';
        const history: string[] = [];
        let historyIndex = -1;

        term.onKey(({ key, domEvent }) => {
          const { key: pressedKey, ctrlKey } = domEvent;

          if (ctrlKey && pressedKey.toLowerCase() === 'c') {
            if (term.hasSelection()) {
              navigator.clipboard.writeText(term.getSelection() ?? '').catch(() => {});
              term.clearSelection();
            }
            return;
          }

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
              term.write('\r\n');
              const trimmed = commandBuffer.trim();
              if (trimmed.length > 0) {
                executeCommand(trimmed);
                history.unshift(trimmed);
              }
              commandBuffer = '';
              historyIndex = -1;
              term.write('$ ');
              break;

            case 'Backspace':
              if (commandBuffer.length > 0) {
                commandBuffer = commandBuffer.slice(0, -1);
                term.write('\b \b');
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
              commandBuffer += '\t';
              term.write('  ');
              break;

            default:
              if (pressedKey.length === 1 && !ctrlKey) {
                commandBuffer += pressedKey;
                term.write(pressedKey);
              }
              break;
          }
        });

        const redrawCommandLine = (term: Terminal, buffer: string) => {
          // Clear current line after `$ `
          term.write('\x1b[2K\r$ ' + buffer);
        };


      } else {
        requestAnimationFrame(waitForContainerReady);
      }
    };

    waitForContainerReady();

    return () => {
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, [mode]);

  // ──────────────────────────────────────────────
  // Socket handling
  // ──────────────────────────────────────────────
  useEffect(() => {
    const term = xtermRef.current;
    if (!term) return;

    const handleOutput = (data: string) => {
      term.write(data);
      appendOutput(data);
    };

    const handleError = (data: string) => {
      term.writeln(`\r\n\x1b[31mError:\x1b[0m ${data}`);
    };

    socketService.on('output', handleOutput);
    socketService.on('outputMessage', handleOutput);
    socketService.on('error', handleError);

    return () => {
      socketService.off('output', handleOutput);
      socketService.off('outputMessage', handleOutput);
      socketService.off('error', handleError);
    };
  }, []);

  // ──────────────────────────────────────────────
  // Auto-connect if authenticated
  // ──────────────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    connectTerminal().catch(async (error) => {
      console.error('Connection failed:', error);
      if (error === 'No authentication token.') {
        await handleLogout();
        navigate('/login');
      }
    });
    return () => {
    socketService.disconnect(); // ✅ Ensure cleanup on unmount
  };
  }, []);

  // ──────────────────────────────────────────────
  // Dynamic height refit
  // ──────────────────────────────────────────────
  useEffect(() => {
    requestAnimationFrame(() => {
      try {
        fitAddonRef.current?.fit();
      } catch {
        /* ignore renderer not ready */
      }
    });
  }, [terminalHeight]);
  useEffect(() => {
  const container = terminalContainerRef.current;
  const term = xtermRef.current;
  if (!container || !term) return;

  const handleContextMenu = async (event: MouseEvent) => {
    event.preventDefault();
    if (term.hasSelection()) {
      const selectedText = term.getSelection();
      await navigator.clipboard.writeText(selectedText);
      term.clearSelection();
    } else {
      const text = await navigator.clipboard.readText();
      term.paste(text);
    }
  };

  container.addEventListener('contextmenu', handleContextMenu);
  return () => container.removeEventListener('contextmenu', handleContextMenu);
}, []);
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
        currentPath=""
        onConnect={connectTerminal}
        onDisconnect={disconnectTerminal}
        onSettings={() => setOpen(true)}
        onLogout={onLogout}
        sx={{ position: 'sticky', top: 0, zIndex: 1 }}
      />

      <Box
        ref={terminalContainerRef}
        onClick={() => terminalContainerRef.current?.focus()}
        sx={{
          flexGrow: 1,
          height: `${terminalHeight}px`,
          overflow: 'hidden',
          '.xterm': { padding: '8px' },
        }}
      />

      <TerminalSettingsDialog open={open} onClose={() => setOpen(false)} />
    </Paper>
  );
};
