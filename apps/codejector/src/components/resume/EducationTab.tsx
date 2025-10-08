import React from 'react';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import { styled } from '@mui/system';
import { EducationDto, ResumeForm } from '@/types/resume';

// Styled component
const StyledTextField = styled(TextField)({
  width: '100%',
  marginBottom: '16px',
});

interface EducationTabProps {
  formData: ResumeForm;
  handleEducationChange: (
    id: number,
    field: keyof EducationDto,
    value: string,
  ) => void;
  addEducation: () => void;
  removeEducation: (id: number) => void;
}

const EducationTab = ({
  formData,
  handleEducationChange,
  addEducation,
  removeEducation,
}: EducationTabProps) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    {formData.education.map((edu, index) => (
      <Paper
        key={edu.id}
        sx={{
          p: 3,
          border: '1px solid',
          borderColor: 'grey.200',
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
            Education #{index + 1}
          </Typography>
          {formData.education.length > 1 && (
            <Button
              variant="text"
              color="error"
              onClick={() => removeEducation(edu.id)}
            >
              Remove
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ fontSize: '0.875rem', fontWeight: 'medium', mb: 1 }}
            >
              Degree
            </Typography>
            <StyledTextField
              type="text"
              placeholder="Bachelor of Science in Computer Science"
              value={edu.degree}
              onChange={(e) =>
                handleEducationChange(edu.id, 'degree', e.target.value)
              }
            />
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ fontSize: '0.875rem', fontWeight: 'medium', mb: 1 }}
            >
              Institution
            </Typography>
            <StyledTextField
              type="text"
              placeholder="Stanford University"
              value={edu.institution}
              onChange={(e) =>
                handleEducationChange(edu.id, 'institution', e.target.value)
              }
            />
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ fontSize: '0.875rem', fontWeight: 'medium', mb: 1 }}
            >
              Year
            </Typography>
            <StyledTextField
              type="text"
              placeholder="2015 - 2019"
              value={edu.year}
              onChange={(e) =>
                handleEducationChange(edu.id, 'year', e.target.value)
              }
            />
          </Box>
        </Box>
      </Paper>
    ))}
    <Button variant="outlined" fullWidth onClick={addEducation}>
      Add Another Education
    </Button>
  </Box>
);

export default EducationTab;
