import React, { useState, useRef } from 'react';
import { Box, Container, Grid, Paper, Typography } from '@mui/material';
import { styled } from '@mui/system';

import TemplatesTab from '@/components/resume/TemplatesTab';
import ResumePreview from '@/components/resume/ResumePreview';
import SkillsTab from '@/components/resume/SkillsTab';
import EducationTab from '@/components/resume/EducationTab';
import ExperienceTab from '@/components/resume/ExperienceTab';
import PersonalInfoTab from '@/components/resume/PersonalInfoTab';
import Sidebar from '@/components/resume/Sidebar';
import Header from '@/components/resume/Header';

import {
  EducationDto,
  ExperienceDto,
  PersonalInfoDto,
  Template,
} from '@/types';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(3),
}));

const StyledContainer = styled(Container)({
  paddingTop: '32px',
  paddingBottom: '32px',
  flexGrow: 1,
});

const StyledMainContent = styled('main')({
  flexGrow: 1,
  overflowY: 'auto',
  padding: '24px',
});

// Define the ResumeForm data structure

interface ResumeForm {
  personalInfo: PersonalInfoDto;
  experiences: ExperienceDto[];
  education: EducationDto[];
  skills: string[];
}

// Constants
const templates: Template[] = [
  {
    id: 1,
    name: 'Modern Blue',
    color: '#1976d2',
    textColor: '#1976d2',
    borderColor: '#1976d2',
  },
  {
    id: 2,
    name: 'Professional Grey',
    color: '#616161',
    textColor: '#616161',
    borderColor: '#616161',
  },
  {
    id: 3,
    name: 'Executive Purple',
    color: '#7b1fa2',
    textColor: '#7b1fa2',
    borderColor: '#7b1fa2',
  },
];

const initialFormData: ResumeForm = {
  personalInfo: {
    name: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
  },
  experiences: [
    { id: 1, position: '', company: '', duration: '', description: '' },
  ],
  education: [{ id: 1, degree: '', institution: '', year: '' }],
  skills: [],
};

const skillOptions: string[] = [
  'JavaScript',
  'React',
  'Node.js',
  'Python',
  'HTML/CSS',
  'UI/UX Design',
  'Project Management',
  'Communication',
  'Team Leadership',
  'Problem Solving',
  'Data Analysis',
  'Cloud Computing',
  'DevOps',
  'Agile Methodologies',
];

// Main ResumeBuilder Component
function ResumeBuilder() {
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState<ResumeForm>(initialFormData);
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const resumeRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (
    section: keyof ResumeForm,
    field: string,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value,
      },
    }));
  };

  const handleExperienceChange = (
    id: number,
    field: keyof ExperienceDto,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp,
      ),
    }));
  };

  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          id: prev.experiences.length + 1,
          position: '',
          company: '',
          duration: '',
          description: '',
        },
      ],
    }));
  };

  const removeExperience = (id: number) => {
    if (formData.experiences.length > 1) {
      setFormData((prev) => ({
        ...prev,
        experiences: prev.experiences.filter((exp) => exp.id !== id),
      }));
    }
  };

  const handleEducationChange = (
    id: number,
    field: keyof EducationDto,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu,
      ),
    }));
  };

  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: prev.education.length + 1,
          degree: '',
          institution: '',
          year: '',
        },
      ],
    }));
  };

  const removeEducation = (id: number) => {
    if (formData.education.length > 1) {
      setFormData((prev) => ({
        ...prev,
        education: prev.education.filter((edu) => edu.id !== id),
      }));
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const calculateCompletion = () => {
    let completed = 0;
    let total = 0;

    // Personal info
    Object.values(formData.personalInfo).forEach((value) => {
      total++;
      if (value && value.trim() !== '') completed++;
    });

    // Experiences
    formData.experiences.forEach((exp) => {
      Object.values(exp).forEach((value) => {
        if (typeof value === 'string') {
          total++;
          if (value && value.trim() !== '') completed++;
        }
      });
    });

    // Education
    formData.education.forEach((edu) => {
      Object.values(edu).forEach((value) => {
        if (typeof value === 'string') {
          total++;
          if (value && value.trim() !== '') completed++;
        }
      });
    });

    // Skills
    total++;
    if (selectedSkills.length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  const exportResume = () => {
    if (resumeRef.current) {
      const originalBodyStyle = document.body.style.overflow;
      document.body.style.overflow = 'visible';
      window.print();
      document.body.style.overflow = originalBodyStyle;
    }
  };

  const completionPercentage = calculateCompletion();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <PersonalInfoTab
            formData={formData}
            handleInputChange={handleInputChange}
          />
        );
      case 'experience':
        return (
          <ExperienceTab
            formData={formData}
            handleExperienceChange={handleExperienceChange}
            addExperience={addExperience}
            removeExperience={removeExperience}
          />
        );
      case 'education':
        return (
          <EducationTab
            formData={formData}
            handleEducationChange={handleEducationChange}
            addEducation={addEducation}
            removeEducation={removeEducation}
          />
        );
      case 'skills':
        return (
          <SkillsTab
            selectedSkills={selectedSkills}
            toggleSkill={toggleSkill}
            skillOptions={skillOptions}
          />
        );
      case 'templates':
        return (
          <TemplatesTab
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            templates={templates}
          />
        );
      default:
        return (
          <PersonalInfoTab
            formData={formData}
            handleInputChange={handleInputChange}
          />
        );
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          completionPercentage={completionPercentage}
        />

        <StyledMainContent>
          <StyledContainer maxWidth="lg">
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <StyledPaper>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                    {activeTab === 'personal' && 'Personal Information'}
                    {activeTab === 'experience' && 'Work Experience'}
                    {activeTab === 'education' && 'Education'}
                    {activeTab === 'skills' && 'Skills'}
                    {activeTab === 'templates' && 'Choose a Template'}
                  </Typography>
                  {renderActiveTab()}
                </StyledPaper>
              </Grid>

              <Grid item xs={12} md={6}>
                <ResumePreview
                  formData={formData}
                  selectedTemplate={selectedTemplate}
                  selectedSkills={selectedSkills}
                  resumeRef={resumeRef}
                  exportResume={exportResume}
                />
              </Grid>
            </Grid>
          </StyledContainer>
        </StyledMainContent>
      </Box>
    </Box>
  );
}

export default ResumeBuilder;
