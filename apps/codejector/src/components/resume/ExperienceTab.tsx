import React from 'react';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import { styled } from '@mui/system';
import { ExperienceDto, ResumeForm } from '@/types/resume';

// Styled component
const StyledTextField = styled(TextField)({
  width: '100%',
  marginBottom: '16px',
});

interface ExperienceTabProps {
  formData: ResumeForm;
  handleExperienceChange: (
    id: number,
    field: keyof ExperienceDto,
    value: string,
  ) => void;
  addExperience: () => void;
  removeExperience: (id: number) => void;
}

const ExperienceTab = ({
  formData,
  handleExperienceChange,
  addExperience,
  removeExperience,
}: ExperienceTabProps) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    {formData.experiences.map((exp, index) => (
      <Paper
        key={exp.id}
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
            Experience #{index + 1}
          </Typography>
          {formData.experiences.length > 1 && (
            <Button
              variant="text"
              color="error"
              onClick={() => removeExperience(exp.id)}
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
              Position
            </Typography>
            <StyledTextField
              type="text"
              placeholder="Senior Developer"
              value={exp.position}
              onChange={(e) =>
                handleExperienceChange(exp.id, 'position', e.target.value)
              }
            />
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ fontSize: '0.875rem', fontWeight: 'medium', mb: 1 }}
            >
              Company
            </Typography>
            <StyledTextField
              type="text"
              placeholder="Google Inc."
              value={exp.company}
              onChange={(e) =>
                handleExperienceChange(exp.id, 'company', e.target.value)
              }
            />
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ fontSize: '0.875rem', fontWeight: 'medium', mb: 1 }}
            >
              Duration
            </Typography>
            <StyledTextField
              type="text"
              placeholder="Jan 2020 - Present"
              value={exp.duration}
              onChange={(e) =>
                handleExperienceChange(exp.id, 'duration', e.target.value)
              }
            />
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ fontSize: '0.875rem', fontWeight: 'medium', mb: 1 }}
            >
              Description
            </Typography>
            <TextField
              multiline
              rows={3}
              placeholder="Responsible for leading a team of developers..."
              value={exp.description}
              onChange={(e) =>
                handleExperienceChange(exp.id, 'description', e.target.value)
              }
              sx={{ width: '100%' }}
            />
          </Box>
        </Box>
      </Paper>
    ))}
    <Button variant="outlined" fullWidth onClick={addExperience}>
      Add Another Experience
    </Button>
  </Box>
);

export default ExperienceTab;
