import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import ResumeUploadDialog from './ResumeUploadDialog';
import ResumeDisplay from './ResumeDisplay';

interface ResumeParserContainerProps {
  onParse: (file: File) => Promise<string>;
}

const ResumeParserContainer = ({ onParse }: ResumeParserContainerProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resumeContent, setResumeContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setError(null);
  };

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const content = await onParse(file);
      setResumeContent(content);
      handleDialogClose();
    } catch (e: any) {
      setError(e.message || 'An error occurred while parsing the resume.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6">Resume Parser</Typography>
      <Button variant="contained" onClick={handleDialogOpen}>
        Upload Resume
      </Button>
      <ResumeUploadDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onUpload={handleFileUpload}
        loading={loading}
        error={error}
      />
      <ResumeDisplay content={resumeContent} />
    </Box>
  );
};

export default ResumeParserContainer;
