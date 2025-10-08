import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { styled } from '@mui/system';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import BuildIcon from '@mui/icons-material/Build';
import PaletteIcon from '@mui/icons-material/Palette';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

// Styled component
const StyledSidebar = styled('aside')(({ theme }) => ({
  width: '256px',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows?.[2],
  padding: theme.spacing(3),
  display: 'none',
  [theme.breakpoints.up('md')]: {
    display: 'block',
  },
}));

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  completionPercentage: number;
}

const Sidebar = ({
  activeTab,
  setActiveTab,
  completionPercentage,
}: SidebarProps) => (
  <StyledSidebar>
    <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 2 }}>
      Resume Builder
    </Typography>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Button
        fullWidth
        variant={activeTab === 'personal' ? 'contained' : 'text'}
        color="primary"
        startIcon={<PersonIcon />}
        onClick={() => setActiveTab('personal')}
        sx={{ justifyContent: 'flex-start' }}
      >
        Personal Info
      </Button>
      <Button
        fullWidth
        variant={activeTab === 'experience' ? 'contained' : 'text'}
        color="primary"
        startIcon={<WorkIcon />}
        onClick={() => setActiveTab('experience')}
        sx={{ justifyContent: 'flex-start' }}
      >
        Work Experience
      </Button>
      <Button
        fullWidth
        variant={activeTab === 'education' ? 'contained' : 'text'}
        color="primary"
        startIcon={<SchoolIcon />}
        onClick={() => setActiveTab('education')}
        sx={{ justifyContent: 'flex-start' }}
      >
        Education
      </Button>
      <Button
        fullWidth
        variant={activeTab === 'skills' ? 'contained' : 'text'}
        color="primary"
        startIcon={<BuildIcon />}
        onClick={() => setActiveTab('skills')}
        sx={{ justifyContent: 'flex-start' }}
      >
        Skills
      </Button>
      <Button
        fullWidth
        variant={activeTab === 'templates' ? 'contained' : 'text'}
        color="primary"
        startIcon={<PaletteIcon />}
        onClick={() => setActiveTab('templates')}
        sx={{ justifyContent: 'flex-start' }}
      >
        Templates
      </Button>
    </Box>

    <Box sx={{ mt: 4 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 'medium', mb: 1 }}>
        Resume Completion
      </Typography>
      <Box
        sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 4, height: 10 }}
      >
        <Box
          sx={{
            bgcolor: 'primary.main',
            height: 10,
            borderRadius: 4,
            width: `${completionPercentage}%`,
          }}
        />
      </Box>
      <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
        {completionPercentage}% complete
      </Typography>
    </Box>

    <Box sx={{ mt: 4 }}>
      <Typography
        variant="subtitle2"
        sx={{ fontSize: '0.875rem', fontWeight: 'medium', mb: 1 }}
      >
        AI Suggestions
      </Typography>
      <Box
        sx={{
          bgcolor: 'warning.light',
          border: '1px solid',
          borderColor: 'warning.main',
          borderRadius: 2,
          p: 2,
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: 'warning.dark', display: 'flex', alignItems: 'center' }}
        >
          <LightbulbIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
          Add quantifiable achievements to increase impact by 65%
        </Typography>
      </Box>
    </Box>
  </StyledSidebar>
);

export default Sidebar;
