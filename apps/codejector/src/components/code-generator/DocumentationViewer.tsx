//import React from 'react';
import { Box, Paper } from '@mui/material';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';

export function DocumentationViewer({
  documentation,
}: {
  documentation: string;
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Paper variant="outlined">
        <CodeMirror
          value={documentation}
          height="300px"
          extensions={[markdown()]}
          editable={false}
          theme="dark"
        />
      </Paper>
    </Box>
  );
}
