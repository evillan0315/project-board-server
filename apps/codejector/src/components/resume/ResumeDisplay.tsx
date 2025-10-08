import React from 'react';
import { Typography, Paper } from '@mui/material';
import { styled } from '@mui/system';

interface ResumeDisplayProps {
  content: string | null;
}

const StyledPaper = styled(Paper)({
  padding: '24px',
  marginTop: '16px',
  borderRadius: '4px',
  overflowX: 'auto',
});

const StyledTypography = styled(Typography)({
  whiteSpace: 'pre-wrap',
});

const ResumeDisplay = ({ content }: ResumeDisplayProps) => (
  <StyledPaper elevation={3}>
    {content ? (
      <StyledTypography variant="body1">{content}</StyledTypography>
    ) : (
      <Typography variant="body1">No resume content to display.</Typography>
    )}
  </StyledPaper>
);

export default ResumeDisplay;
