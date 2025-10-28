import React from 'react';
import CodeMirrorEditor from '@/components/codemirror/CodeMirrorEditor';
import { Box } from '@mui/material';

interface CodeRepairProps {
  value: string;
  onChange: (value: string) => void;
  filePath: string;
  height?: string;
  width?: string;
}

export const CodeRepair: React.FC<CodeRepairProps> = ({
  value,
  onChange,
  filePath,
  height,
  width,
}) => {
  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        overflowY: 'hidden',
        position: 'relative',
      }}
    >

      <CodeMirrorEditor
        value={value}
        onChange={onChange}
        filePath={filePath}
        height={height ? height : '100%'}
        width={width ? width : '100%'}
      />
  
    </Box>
  );
};

