import React, { useState, useCallback } from 'react';
import TextField from './ui/TextField';
import Button from './ui/Button';
import CircularProgress from './ui/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import MailIcon from '@mui/icons-material/MailOutline'; // Icon for cover letter

interface CoverLetterGeneratorSectionProps {
  onGenerateCoverLetter: (resumeContent: string, jobDescription: string, prompt?: string) => Promise<void>;
  loading: boolean;
  currentResumeContent: string;
  currentJobDescription: string;
}

const CoverLetterGeneratorSection: React.FC<CoverLetterGeneratorSectionProps> = ({
  onGenerateCoverLetter,
  loading,
  currentResumeContent,
  currentJobDescription,
}) => {
  const [coverLetterPrompt, setCoverLetterPrompt] = useState('');

  const handleGenerateClick = useCallback(async () => {
    if (!currentResumeContent.trim()) {
      alert('Please provide resume content before generating a cover letter.');
      return;
    }
    if (!currentJobDescription.trim()) {
      alert('Please provide a job description before generating a cover letter.');
      return;
    }

    await onGenerateCoverLetter(currentResumeContent, currentJobDescription, coverLetterPrompt.trim() || undefined);
  }, [currentResumeContent, currentJobDescription, coverLetterPrompt, onGenerateCoverLetter]);

  return (
    <Box className="flex flex-col gap-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-colors duration-300">
      <Typography
        variant="h6"
        className="!font-semibold !text-gray-800 dark:!text-gray-200 flex items-center gap-2 mb-4 transition-colors duration-300"
      >
        <MailIcon /> Generate Cover Letter
      </Typography>
      <TextField
        label="Resume Content (Used as Context)"
        multiline
        rows={10}
        value={currentResumeContent}
        InputProps={{
          readOnly: true, // Make it read-only as it reflects the main resume content
        }}
        placeholder="Cover letter will be generated based on this resume content."
        className="w-full mb-4"
      />
      <TextField
        label="Job Description (Used as Context)"
        multiline
        rows={6}
        value={currentJobDescription}
        InputProps={{
          readOnly: true, // Make it read-only as it reflects the main job description
        }}
        placeholder="Cover letter will be tailored to this job description."
        className="w-full mb-4"
      />
      <TextField
        label="Cover Letter Prompt (Optional)"
        multiline
        rows={4}
        value={coverLetterPrompt}
        onChange={(e) => setCoverLetterPrompt(e.target.value)}
        placeholder="E.g., 'Write a cover letter emphasizing my leadership skills', 'Focus on my experience with backend development and cloud platforms.'"
        className="w-full mb-4"
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleGenerateClick}
        disabled={loading || !currentResumeContent.trim() || !currentJobDescription.trim()}
        className="!bg-pink-600 hover:!bg-pink-700 !text-white !py-2 !text-md !font-bold"
        startIcon={loading && <CircularProgress size={20} color="inherit" />}
      >
        {loading ? 'Generating Cover Letter...' : 'Generate Cover Letter'}
      </Button>
    </Box>
  );
};

export default CoverLetterGeneratorSection;
