import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

interface ResumeDisplaySectionProps {
  title: string;
  content: string;
}

const ResumeDisplaySection: React.FC<ResumeDisplaySectionProps> = ({ title, content }) => {
  if (!content) return null;

  return (
    <Paper elevation={2} className="p-6 mt-6 bg-gray-50/50 border border-gray-200">
      <Typography variant="h6" className="!font-semibold !text-gray-800 mb-4">
        {title}
      </Typography>
      <Box
        className="bg-white p-4 rounded-md border border-gray-300 overflow-auto max-h-[500px]"
        sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.9rem' }}
      >
        {content}
      </Box>
    </Paper>
  );
};

export default ResumeDisplaySection;
