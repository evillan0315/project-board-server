import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  Box,
  CircularProgress,
} from '@mui/material';

import CodeMirrorEditor from '@/components/codemirror/CodeMirrorEditor';

interface GitDiffViewerDialogProps {
  open: boolean;
  onClose: () => void;
  diffContent: string | null;
  filePath: string | null;
  loading: boolean;
  mode: 'light' | 'dark'; // Inherit theme mode for CodeMirror
}

export function GitDiffViewerDialog({
  open,
  onClose,
  diffContent,
  filePath,
  loading,
  mode,
}: GitDiffViewerDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Diff Viewer: {filePath}</DialogTitle>
      <DialogContent className="p-0">
        <Box className="h-[60vh] w-full border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden">
          {diffContent ? (
            <CodeMirrorEditor
              value={diffContent}
              filePath={filePath || 'diff.diff'}
              readOnly={true}
              height="100%"
              isDiffView={true}
              themeMode={mode}
            />
          ) : (
            <Box className="flex items-center justify-center h-full">
              <CircularProgress />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
