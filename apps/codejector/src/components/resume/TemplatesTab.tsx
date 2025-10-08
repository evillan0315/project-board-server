import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { styled } from '@mui/system';
import AppsIcon from '@mui/icons-material/Apps';
import { Template } from '@/types/resume';

// Styled component
const StyledTemplateCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'selected',
})<{ selected?: boolean }>(({ theme, selected }) => ({
  border: `2px solid ${selected ? theme.palette.primary.main : 'transparent'}`,
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'border-color 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.light,
  },
}));

interface TemplatesTabProps {
  selectedTemplate: Template;
  setSelectedTemplate: (template: Template) => void;
  templates: Template[];
}

const TemplatesTab = ({
  selectedTemplate,
  setSelectedTemplate,
  templates,
}: TemplatesTabProps) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
      Choose a resume template
    </Typography>
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        },
        gap: 2,
      }}
    >
      {templates.map((template) => (
        <StyledTemplateCard
          key={template.id}
          selected={selectedTemplate.id === template.id}
          onClick={() => setSelectedTemplate(template)}
        >
          <Box
            sx={{
              height: 120,
              bgcolor: template.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppsIcon sx={{ color: 'white', fontSize: '2.5rem' }} />
          </Box>
          <CardContent sx={{ p: 2 }}>
            <Typography
              variant="h6"
              sx={{ fontSize: '1rem', fontWeight: 'medium' }}
            >
              {template.name}
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }}
            >
              Professional design
            </Typography>
          </CardContent>
        </StyledTemplateCard>
      ))}
    </Box>
  </Box>
);

export default TemplatesTab;
