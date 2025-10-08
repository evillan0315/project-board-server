import React from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { styled } from '@mui/system';
import { ResumeForm, PersonalInfoDto } from '@/types/resume';

// Styled component
const StyledTextField = styled(TextField)({
  width: '100%',
  marginBottom: '16px',
});

interface PersonalInfoTabProps {
  formData: ResumeForm;
  handleInputChange: (
    section: keyof ResumeForm,
    field: keyof PersonalInfoDto,
    value: string,
  ) => void;
}

const PersonalInfoTab = ({
  formData,
  handleInputChange,
}: PersonalInfoTabProps) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Box>
      <Typography
        variant="subtitle1"
        sx={{ fontSize: '0.875rem', fontWeight: 'medium', mb: 1 }}
      >
        Full Name
      </Typography>
      <StyledTextField
        type="text"
        placeholder="John Doe"
        value={formData.personalInfo.name}
        onChange={(e) =>
          handleInputChange('personalInfo', 'name', e.target.value)
        }
      />
    </Box>
    <Box>
      <Typography
        variant="subtitle1"
        sx={{ fontSize: '0.875rem', fontWeight: 'medium', mb: 1 }}
      >
        Professional Title
      </Typography>
      <StyledTextField
        type="text"
        placeholder="Software Engineer"
        value={formData.personalInfo.title}
        onChange={(e) =>
          handleInputChange('personalInfo', 'title', e.target.value)
        }
      />
    </Box>
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 2,
      }}
    >
      <Box>
        <Typography
          variant="subtitle1"
          sx={{ fontSize: '0.875rem', fontWeight: 'medium', mb: 1 }}
        >
          Email
        </Typography>
        <StyledTextField
          type="email"
          placeholder="john.doe@example.com"
          value={formData.personalInfo.email}
          onChange={(e) =>
            handleInputChange('personalInfo', 'email', e.target.value)
          }
        />
      </Box>
      <Box>
        <Typography
          variant="subtitle1"
          sx={{ fontSize: '0.875rem', fontWeight: 'medium', mb: 1 }}
        >
          Phone
        </Typography>
        <StyledTextField
          type="tel"
          placeholder="(123) 456-7890"
          value={formData.personalInfo.phone}
          onChange={(e) =>
            handleInputChange('personalInfo', 'phone', e.target.value)
          }
        />
      </Box>
    </Box>
    <Box>
      <Typography
        variant="subtitle1"
        sx={{ fontSize: '0.875rem', fontWeight: 'medium', mb: 1 }}
      >
        Location
      </Typography>
      <StyledTextField
        type="text"
        placeholder="San Francisco, CA"
        value={formData.personalInfo.location}
        onChange={(e) =>
          handleInputChange('personalInfo', 'location', e.target.value)
        }
      />
    </Box>
    <Box>
      <Typography
        variant="subtitle1"
        sx={{ fontSize: '0.875rem', fontWeight: 'medium', mb: 1 }}
      >
        Professional Summary
      </Typography>
      <TextField
        multiline
        rows={4}
        placeholder="Experienced software engineer with 5+ years of expertise in..."
        value={formData.personalInfo.summary}
        onChange={(e) =>
          handleInputChange('personalInfo', 'summary', e.target.value)
        }
        sx={{ width: '100%' }}
      />
    </Box>
  </Box>
);

export default PersonalInfoTab;
