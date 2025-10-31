import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

interface PortfolioDisplaySectionProps {
  title: string;
  htmlContent: string;
}

const PortfolioDisplaySection: React.FC<PortfolioDisplaySectionProps> = ({ title, htmlContent }) => {
  if (!htmlContent) return null;

  // Using an iframe with srcDoc for safer rendering of potentially untrusted HTML
  // The sandbox attribute further restricts what the iframe content can do.
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
        className="bg-white dark:bg-gray-800 p-0 rounded-md border border-gray-300 dark:border-gray-600 overflow-auto transition-colors duration-300"
        sx={{
          width: '100%',
          height: '800px', // Fixed height for the iframe container
          position: 'relative',
          overflow: 'hidden', // Hide iframe scrollbars if they appear
        }}
      >
        <iframe
          title="Generated Portfolio"
          srcDoc={htmlContent}
          style={{
            border: 'none',
            width: '100%',
            height: '100%',
          }}
          sandbox="allow-scripts allow-forms allow-popups allow-same-origin" // Restrict iframe capabilities for security
        />
      </Box>
    </Paper>
  );
};

export default PortfolioDisplaySection;
