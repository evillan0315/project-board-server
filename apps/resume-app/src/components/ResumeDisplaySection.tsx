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
    <Paper
      elevation={2}
      className="p-6 mt-6 bg-gray-50/50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-700 transition-colors duration-300"
    >
      <Typography
        variant="h6"
        className="!font-semibold !text-gray-800 dark:!text-gray-200 mb-4 transition-colors duration-300"
      >
        {title}
      </Typography>
      <Box
        className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-300 dark:border-gray-600 overflow-auto max-h-[500px] transition-colors duration-300"
        sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.9rem' }}
      >
        {content}
      </Box>
    </Paper>
  );
};

export default ResumeDisplaySection;
