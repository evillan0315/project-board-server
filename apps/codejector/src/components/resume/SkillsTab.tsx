import React from 'react';
import { Box, Button, Typography } from '@mui/material';

interface SkillsTabProps {
  selectedSkills: string[];
  toggleSkill: (skill: string) => void;
  skillOptions: string[];
}

const SkillsTab = ({
  selectedSkills,
  toggleSkill,
  skillOptions,
}: SkillsTabProps) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
      Select your skills
    </Typography>
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        gap: 1.5,
      }}
    >
      {skillOptions.map((skill) => (
        <Button
          key={skill}
          variant={selectedSkills.includes(skill) ? 'contained' : 'outlined'}
          color="primary"
          onClick={() => toggleSkill(skill)}
          sx={{
            py: 1,
            px: 1.5,
            borderRadius: 2,
            fontSize: '0.875rem',
            textTransform: 'none',
          }}
        >
          {skill}
        </Button>
      ))}
    </Box>
  </Box>
);

export default SkillsTab;
