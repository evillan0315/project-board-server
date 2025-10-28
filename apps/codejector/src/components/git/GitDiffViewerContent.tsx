import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useStore } from '@nanostores/react';

import CodeMirrorEditor from '@/components/codemirror/CodeMirrorEditor';
import { themeStore } from '@/stores/themeStore';

interface GitDiffViewerContentProps {
  diffContent: string | null;
  filePath: string | null;
  loading: boolean;
}

/**
 * `GitDiffViewerContent` is a component that displays a Git diff within a CodeMirror editor.
 * It is designed to be used as the `content` prop for the `GlobalDialog`.
 */
export function GitDiffViewerContent({
  diffContent,
  filePath,
  loading,
}: GitDiffViewerContentProps) {
  const { mode } = useStore(themeStore);

  return (
    <Box className="h-[60vh] w-full border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden">
      {loading ? (
        <Box className="flex items-center justify-center h-full">
          <CircularProgress />
        </Box>
      ) : diffContent !== null ? (
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
          <p>No diff content available.</p>
        </Box>
      )}
    </Box>
  );
}
