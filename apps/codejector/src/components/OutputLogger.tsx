/**
 * FilePath: src/components/terminal/OutputLogger.tsx
 * Title: Global Log Viewer with Structured Terminal Output
 * Reason: Displays logs from the global Nanostore, including structured command outputs,
 *          system messages, and detailed info for debugging or monitoring user actions.
 */

import React, { useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { logStore, LogEntry, clearLogs } from '@/stores/logStore';
import {
  Box,
  Typography,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  Tooltip,
  IconButton,
  Fab,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';

interface OutputLoggerProps {}

/**
 * Selects an icon matching the log severity.
 */
const getSeverityIcon = (severity: LogEntry['severity']) => {
  switch (severity) {
    case 'error':
      return <ErrorOutlineOutlinedIcon fontSize="small" color="error" />;
    case 'warning':
      return <WarningAmberOutlinedIcon fontSize="small" color="warning" />;
    case 'success':
      return <CheckCircleOutlineOutlinedIcon fontSize="small" color="success" />;
    case 'debug':
      return <BugReportOutlinedIcon fontSize="small" color="info" />;
    case 'info':
    default:
      return <InfoOutlinedIcon fontSize="small" color="info" />;
  }
};

/**
 * Renders JSON-based stdout/stderr arrays in a human-readable format.
 */
const renderCommandOutput = (output: any[] = [], color: string) => {
  if (!output.length) return null;
  return output.map((line, idx) => (
    <Typography
      key={idx}
      variant="body2"
      component="pre"
      sx={{
        m: 0,
        fontFamily: 'monospace',
        color,
      }}
    >
      {typeof line === 'object' ? JSON.stringify(line, null, 2) : String(line)}
    </Typography>
  ));
};

/**
 * Displays all logs in collapsible panels with copy and clear support.
 */
const OutputLogger: React.FC<OutputLoggerProps> = () => {
  const logs = useStore(logStore);
  const theme = useTheme();
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCopyToClipboard = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy).catch((err) => {
      console.error('Failed to copy log:', err);
    });
  };

  if (logs.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: theme.palette.text.secondary }}>
        <Typography variant="body2">No logs to display yet.</Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={logContainerRef}
      sx={{
        height: '100%',
        overflowY: 'auto',
        position: 'relative',
        p: 1,
        bgcolor: theme.palette.background.default,
      }}
    >
      {logs.map((log, index) => (
        <Accordion
          key={log.id}
          defaultExpanded={log.alwaysExpanded}
          sx={{
            mt: index === 0 ? 0 : 1,
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
              {getSeverityIcon(log.severity)}
              <Typography
                variant="subtitle2"
                sx={{ ml: 1, fontWeight: 'bold', flexShrink: 0, color: theme.palette.text.primary }}
              >
                [{log.timestamp}] {log.source}:
              </Typography>
              <Typography
                variant="body2"
                noWrap
                sx={{
                  ml: 1,
                  flexGrow: 1,
                  color: log.severity === 'error' ? theme.palette.error.main : theme.palette.text.primary,
                }}
              >
                {log.message}
              </Typography>
            </Box>
          </AccordionSummary>

          <AccordionDetails sx={{ pt: 1 }}>
            {log.details && (
              <Box
                sx={{
                  position: 'relative',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  p: 1.5,
                  bgcolor: theme.palette.background.default,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`,
                  color: theme.palette.text.primary,
                }}
              >
                <Tooltip title="Copy details">
                  <IconButton
                    size="small"
                    onClick={() => handleCopyToClipboard(log.details || '')}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      color: theme.palette.text.secondary,
                      bgcolor: theme.palette.background.paper + 'A0',
                      '&:hover': { bgcolor: theme.palette.background.paper },
                    }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Typography variant="body2" component="pre" sx={{ margin: 0 }}>
                  {log.details}
                </Typography>
              </Box>
            )}

            {log.rawOutput && (
              <Box
                sx={{
                  mt: log.details ? 2 : 0,
                  p: 1.5,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: theme.palette.background.default,
                  fontFamily: 'monospace',
                  position: 'relative',
                }}
              >
                <Tooltip title="Copy raw output">
                  <IconButton
                    size="small"
                    onClick={() =>
                      handleCopyToClipboard(
                        JSON.stringify(log.rawOutput, null, 2),
                      )
                    }
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      color: theme.palette.text.secondary,
                      bgcolor: theme.palette.background.paper + 'A0',
                      '&:hover': { bgcolor: theme.palette.background.paper },
                    }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                {log.rawOutput.stdout?.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ color: theme.palette.success.main }}>
                      STDOUT
                    </Typography>
                    {renderCommandOutput(log.rawOutput.stdout, theme.palette.text.primary)}
                  </>
                )}

                {log.rawOutput.stderr?.length > 0 && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" sx={{ color: theme.palette.error.main }}>
                      STDERR
                    </Typography>
                    {renderCommandOutput(log.rawOutput.stderr, theme.palette.error.main)}
                  </>
                )}

                <Typography
                  variant="caption"
                  sx={{
                    mt: 1,
                    display: 'block',
                    color: theme.palette.text.secondary,
                  }}
                >
                  Exit Code: {log.rawOutput.exitCode}
                </Typography>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      ))}

      <Fab
        size="small"
        color="secondary"
        aria-label="clear logs"
        onClick={clearLogs}
        sx={{
          position: 'sticky',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
        }}
      >
        <ClearAllIcon />
      </Fab>
    </Box>
  );
};

export default OutputLogger;

