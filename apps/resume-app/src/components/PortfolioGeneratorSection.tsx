import React, { useState, useCallback } from 'react';
import TextField from './ui/TextField';
import Button from './ui/Button';
import CircularProgress from './ui/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import WebIcon from '@mui/icons-material/Web'; // Icon for portfolio

interface PortfolioGeneratorSectionProps {
  onGeneratePortfolio: (resumeContent: string, prompt?: string) => Promise<void>;
  loading: boolean;
  currentResumeContent: string;
}

const PortfolioGeneratorSection: React.FC<PortfolioGeneratorSectionProps> = ({
  onGeneratePortfolio,
  loading,
  currentResumeContent,
}) => {
  const [portfolioPrompt, setPortfolioPrompt] = useState('');

  const handleGenerateClick = useCallback(async () => {
    if (currentResumeContent.trim()) {
      await onGeneratePortfolio(currentResumeContent, portfolioPrompt.trim() || undefined);
    } else {
      alert('Please provide resume content before generating a portfolio.');
    }
  }, [currentResumeContent, portfolioPrompt, onGeneratePortfolio]);

  return (
    <Box className="flex flex-col gap-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-colors duration-300">
      <Typography
        variant="h6"
        className="!font-semibold !text-gray-800 dark:!text-gray-200 flex items-center gap-2 mb-4 transition-colors duration-300"
      >
        <WebIcon /> Generate Portfolio Page
      </Typography>
      <TextField
        label="Resume Content for Portfolio"
        multiline
        rows={10}
        value={currentResumeContent}
        InputProps={{
          readOnly: true, // Make it read-only as it reflects the main resume content
        }}
        placeholder="Portfolio will be generated based on this resume content."
        className="w-full mb-4"
      />
      <TextField
        label="Portfolio Generation Prompt (Optional)"
        multiline
        rows={4}
        value={portfolioPrompt}
        onChange={(e) => setPortfolioPrompt(e.target.value)}
        placeholder="E.g., 'Generate a minimalist portfolio focusing on my engineering projects', 'Create a vibrant portfolio with a blog section.'"
        className="w-full mb-4"
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleGenerateClick}
        disabled={loading || !currentResumeContent.trim()}
        className="!bg-indigo-600 hover:!bg-indigo-700 !text-white !py-2 !text-md !font-bold"
        startIcon={loading && <CircularProgress size={20} color="inherit" />} 
      >
        {loading ? 'Generating Portfolio...' : 'Generate Portfolio'}
      </Button>
    </Box>
  );
};

export default PortfolioGeneratorSection;
