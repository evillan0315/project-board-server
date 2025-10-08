import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { useStore } from '@nanostores/react';
import { themeStore } from '@/stores/themeStore';
import path from 'path-browserify';

interface CodeMirrorStatusProps {
  languageName: string;
  line: number;
  column: number;
  filePath?: string;
  lintIssuesCount: number; // New prop for number of lint issues
  buildErrorMessage: string | null; // New prop for build error message
}

const CodeMirrorStatus: React.FC<CodeMirrorStatusProps> = ({
  languageName,
  line,
  column,
  filePath,
  lintIssuesCount,
  buildErrorMessage,
}) => {
  const muiTheme = useTheme();
  const { mode } = useStore(themeStore);

  // Extract filename if filePath is provided
  const filename = filePath ? path.basename(filePath) : 'No file open';

  const sxStatusText = {
    color: muiTheme.palette.text.secondary,
    fontSize: '0.75rem',
    mx: 1,
    display: 'flex',
    alignItems: 'center',
    '&:not(:last-of-type)': {
      borderRight: `1px solid ${muiTheme.palette.divider}`,
      pr: 1,
    },
    // Conditional styles for error messages
    ...(buildErrorMessage && {
      color: muiTheme.palette.error.main,
      fontWeight: 'bold',
      // flexGrow: 1, // Uncomment if build error should take up maximum space
    }),
  };

  const lintStatusText = lintIssuesCount > 0 ? `Issues: ${lintIssuesCount}` : 'No issues';

  return (
    <Box
      className="flex items-center justify-between px-2 py-1 h-8" // Use justify-between to push status to ends
      sx={{
        backgroundColor: muiTheme.palette.background.paper,
        borderTop: `1px solid ${muiTheme.palette.divider}`,
      }}
    >
      <Box className="flex items-center">
        <Typography sx={sxStatusText}>
          File: {filename}
        </Typography>
        <Typography sx={sxStatusText}>
          Language: {languageName}
        </Typography>
        <Typography sx={sxStatusText}>
          Ln {line}, Col {column}
        </Typography>
      </Box>
      <Box className="flex items-center">
        {buildErrorMessage ? (
          <Typography sx={sxStatusText}>
            Build Error: {buildErrorMessage}
          </Typography>
        ) : (
          <Typography sx={sxStatusText}>
            {lintStatusText}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default CodeMirrorStatus;
