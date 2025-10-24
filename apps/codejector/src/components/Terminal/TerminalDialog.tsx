import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Button,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { socketService } from '@/services/socketService';
import { appendOutput } from '@/components/Terminal/stores/terminalStore'; // assuming you have this
import stripAnsi from 'strip-ansi';
import { useStore } from '@nanostores/react';
import { themeStore } from '@/stores/themeStore';

interface TerminalDialogProps {
  open: boolean;
  token: string;
  initialCwd?: string;
  onClose: () => void;
}

const TerminalDialog: React.FC<TerminalDialogProps> = ({
  open,
  token,
  initialCwd,
  onClose,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { mode } = useStore(themeStore);

  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string[]>([]);

  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Auto-scroll to bottom when output changes */
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  /** Focus input when dialog opens or output is clicked */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleOutputClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  /** Connect to socket on open and clean up on close */
  useEffect(() => {
    if (!open) return;

    let isMounted = true;

    socketService.connect(token, initialCwd).then(() => {
      if (!isMounted) return;

      socketService.on('terminal_output', (data: string) => {
        const plain = stripAnsi(data);
        setOutput((prev) => [...prev, plain]);
        appendOutput(plain); // if you maintain a global store
      });
    });

    return () => {
      isMounted = false;
      socketService.disconnect();
    };
  }, [open, token, initialCwd]);

  const handleSend = () => {
    if (!input.trim()) return;
    socketService.sendInput(input + '\n');
    setInput('');
  };

  const handleResize = useCallback(() => {
    if (outputRef.current) {
      const cols = Math.floor(outputRef.current.offsetWidth / 8); // rough char width
      const rows = Math.floor(outputRef.current.offsetHeight / 16); // rough char height
      socketService.resize(cols, rows);
    }
  }, []);

  /** Handle window resize for terminal size adjustments */
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        Terminal Session
        <IconButton aria-label="close" onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box
          ref={outputRef}
          onClick={handleOutputClick}
          sx={{
            bgcolor:
              mode === 'dark' ? theme.palette.background.default : 'black',
            color: mode === 'dark' ? theme.palette.text.primary : 'white',
            fontFamily: 'monospace',
            p: 2,
            height: 400,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            borderRadius: 1,
          }}
        >
          {output.join('')}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{ flexDirection: 'column', alignItems: 'stretch', p: 2 }}
      >
        <TextField
          inputRef={inputRef}
          fullWidth
          size="small"
          variant="outlined"
          placeholder="Type a command"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSend();
            }
          }}
          InputProps={{
            sx: { fontFamily: 'monospace' },
          }}
        />
        <Button
          variant="contained"
          sx={{ mt: 1, alignSelf: 'flex-end' }}
          onClick={handleSend}
        >
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TerminalDialog;
