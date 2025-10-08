import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandIcon from '@mui/icons-material/Expand';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { ResumeForm, Template } from '@/types/resume';

interface ResumePreviewProps {
  formData: ResumeForm;
  selectedTemplate: Template;
  selectedSkills: string[];
  resumeRef: React.RefObject<HTMLDivElement | null>;
  exportResume: () => void;
}

const ResumePreview = ({
  formData,
  selectedTemplate,
  selectedSkills,
  resumeRef,
  exportResume,
}: ResumePreviewProps) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
        Resume Preview
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          sx={{
            px: 2,
            py: 0.5,
            bgcolor: 'grey.100',
            color: 'text.primary',
            borderRadius: 2,
            fontSize: '0.875rem',
          }}
          startIcon={<ExpandIcon />}
        >
          Full Screen
        </Button>
        <Button
          variant="contained"
          color="primary"
          sx={{
            px: 2,
            py: 0.5,
            borderRadius: 2,
          }}
          startIcon={<DownloadIcon />}
          onClick={exportResume}
        >
          Export PDF
        </Button>
      </Box>
    </Box>
    <Box
      ref={resumeRef}
      sx={{
        border: '1px solid',
        borderColor: 'grey.300',
        borderRadius: 2,
        p: 3,
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {formData.personalInfo.name}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
            {formData.personalInfo.title}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmailIcon sx={{ fontSize: '1rem', color: 'grey.600' }} />
            <Typography variant="body2" sx={{ color: 'grey.700' }}>
              {formData.personalInfo.email}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneIcon sx={{ fontSize: '1rem', color: 'grey.600' }} />
            <Typography variant="body2" sx={{ color: 'grey.700' }}>
              {formData.personalInfo.phone}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOnIcon sx={{ fontSize: '1rem', color: 'grey.600' }} />
            <Typography variant="body2" sx={{ color: 'grey.700' }}>
              {formData.personalInfo.location}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Summary Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          Summary
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {formData.personalInfo.summary}
        </Typography>
      </Box>

      {/* Experience Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          Experience
        </Typography>
        {formData.experiences.map((exp) => (
          <Box key={exp.id} sx={{ mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {exp.position}, {exp.company}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {exp.duration}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {exp.description}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Education Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          Education
        </Typography>
        {formData.education.map((edu) => (
          <Box key={edu.id} sx={{ mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {edu.degree}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {edu.institution}, {edu.year}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Skills Section */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          Skills
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {selectedSkills.map((skill) => (
            <Typography
              key={skill}
              variant="body2"
              sx={{ bgcolor: 'grey.200', px: 1, py: 0.5, borderRadius: 1 }}
            >
              {skill}
            </Typography>
          ))}
        </Box>
      </Box>
    </Box>
  </Box>
);

export default ResumePreview;
