import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { resumeStore, resetErrors } from '@/stores/resumeStore';
import { parseResumeFile, optimizeResume, generateResume, enhanceResume } from '@/api/resumeApi';
import ResumeForm from '@/components/ResumeForm';
import OptimizationDisplaySection from '@/components/OptimizationDisplaySection';
import GenerateEnhanceSection from '@/components/GenerateEnhanceSection';
import ResumeDisplaySection from '@/components/ResumeDisplaySection';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

// Define TabPanelProps for better type safety
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      className="p-4"
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          <Typography component="div">{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const ResumeGeneratorPage: React.FC = () => {
  const $resume = useStore(resumeStore);
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    resetErrors(); // Clear errors when changing tabs
  };

  const handleParse = async (file: File) => {
    resumeStore.setKey('loading', { ...$resume.loading, parse: true });
    resumeStore.setKey('error', { ...$resume.error, parse: null, general: null });
    try {
      const text = await parseResumeFile(file);
      console.log(text, 'handleParse parseResumeFile');
      resumeStore.setKey('parsedResumeText', text);
      resumeStore.setKey('resumeContent', text); // Set as primary content for other ops
      resumeStore.setKey('optimizationResult', null); // Clear previous results
      resumeStore.setKey('generatedResume', '');
      resumeStore.setKey('enhancedResume', '');
    } catch (err) {
      resumeStore.setKey('error', {
        ...$resume.error,
        parse: err instanceof Error ? err.message : 'Failed to parse resume.',
      });
    } finally {
      resumeStore.setKey('loading', { ...$resume.loading, parse: false });
    }
  };

  const handleOptimize = async (
    jobDescription: string,
    resumeContent?: string,
    resumeFile?: File,
  ) => {
    resumeStore.setKey('loading', { ...$resume.loading, optimize: true });
    resumeStore.setKey('error', { ...$resume.error, optimize: null, general: null });
    try {
      const contentToOptimize = resumeContent || $resume.parsedResumeText || $resume.resumeContent;
      if (!contentToOptimize && !resumeFile) {
        throw new Error('Please provide resume content or upload a file.');
      }

      const result = await optimizeResume({
        resumeContent: contentToOptimize,
        jobDescription: jobDescription,
        resumeFile: resumeFile,
        conversationId: $resume.optimizationResult?.conversationId || undefined, // Continue conversation
      });
      resumeStore.setKey('optimizationResult', result);
      resumeStore.setKey('jobDescription', jobDescription); // Store for persistence
    } catch (err) {
      resumeStore.setKey('error', {
        ...$resume.error,
        optimize: err instanceof Error ? err.message : 'Failed to optimize resume.',
      });
    } finally {
      resumeStore.setKey('loading', { ...$resume.loading, optimize: false });
    }
  };

  const handleGenerate = async (prompt: string) => {
    resumeStore.setKey('loading', { ...$resume.loading, generate: true });
    resumeStore.setKey('error', { ...$resume.error, generate: null, general: null });
    try {
      const generated = await generateResume({ prompt });
      resumeStore.setKey('generatedResume', generated);
      resumeStore.setKey('resumeContent', generated); // Set as current content
      resumeStore.setKey('parsedResumeText', ''); // Clear parsed if generating new
      resumeStore.setKey('optimizationResult', null);
      resumeStore.setKey('enhancedResume', '');
    } catch (err) {
      resumeStore.setKey('error', {
        ...$resume.error,
        generate: err instanceof Error ? err.message : 'Failed to generate resume.',
      });
    } finally {
      resumeStore.setKey('loading', { ...$resume.loading, generate: false });
    }
  };

  const handleEnhance = async (content: string, section?: string, goal?: string) => {
    resumeStore.setKey('loading', { ...$resume.loading, enhance: true });
    resumeStore.setKey('error', { ...$resume.error, enhance: null, general: null });
    try {
      const enhanced = await enhanceResume({
        resumeContent: content || $resume.parsedResumeText || $resume.resumeContent,
        sectionToEnhance: section,
        enhancementGoal: goal,
        conversationId: $resume.enhancedResume
          ? $resume.optimizationResult?.conversationId
          : undefined, // Reuse conversation ID if enhancing existing
      });
      resumeStore.setKey('enhancedResume', enhanced);
      resumeStore.setKey('resumeContent', enhanced); // Update main content with enhanced version
    } catch (err) {
      resumeStore.setKey('error', {
        ...$resume.error,
        enhance: err instanceof Error ? err.message : 'Failed to enhance resume.',
      });
    } finally {
      resumeStore.setKey('loading', { ...$resume.loading, enhance: false });
    }
  };

  const hasError = Object.values($resume.error).some((err) => err !== null);
  const currentErrorMessage =
    $resume.error.parse ||
    $resume.error.optimize ||
    $resume.error.generate ||
    $resume.error.enhance ||
    $resume.error.general;

  return (
    <div className="flex flex-col gap-6">
      <Snackbar
        open={hasError}
        autoHideDuration={6000}
        onClose={() => resumeStore.setKey('error', { ...$resume.error, general: null })} // Only dismiss general error
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => resumeStore.setKey('error', { ...$resume.error, general: null })} // Only dismiss general error
          severity="error"
          sx={{ width: '100%' }}
        >
          {currentErrorMessage}
        </Alert>
      </Snackbar>

      <Paper elevation={2} className="p-6">
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              aria-label="resume actions tabs"
              centered
              className="[&_.MuiTabs-indicator]:!bg-blue-600"
              textColor="inherit"
              indicatorColor="primary"
            >
              <Tab
                label="Upload / Input Resume"
                {...a11yProps(0)}
                className="!text-gray-700 !font-semibold data-[selected=true]:!text-blue-600"
              />
              <Tab
                label="Generate / Enhance Resume"
                {...a11yProps(1)}
                className="!text-gray-700 !font-semibold data-[selected=true]:!text-blue-600"
              />
            </Tabs>
          </Box>
          <CustomTabPanel value={currentTab} index={0}>
            <ResumeForm
              onParse={handleParse}
              onOptimize={handleOptimize}
              loading={{
                parse: $resume.loading.parse,
                optimize: $resume.loading.optimize,
              }}
              parsedResumeText={$resume.parsedResumeText}
              resumeContent={$resume.resumeContent}
              jobDescription={$resume.jobDescription}
              setResumeContent={(content) => resumeStore.setKey('resumeContent', content)}
              setJobDescription={(jd) => resumeStore.setKey('jobDescription', jd)}
            />
            {($resume.parsedResumeText || $resume.generatedResume || $resume.enhancedResume) && (
              <ResumeDisplaySection
                title="Current Resume Content"
                content={$resume.resumeContent}
              />
            )}
            {$resume.optimizationResult && (
              <OptimizationDisplaySection result={$resume.optimizationResult} />
            )}
          </CustomTabPanel>
          <CustomTabPanel value={currentTab} index={1}>
            <GenerateEnhanceSection
              onGenerate={handleGenerate}
              onEnhance={handleEnhance}
              loading={{
                generate: $resume.loading.generate,
                enhance: $resume.loading.enhance,
              }}
              currentResumeContent={$resume.resumeContent}
            />
            {$resume.generatedResume && (
              <ResumeDisplaySection title="Generated Resume" content={$resume.generatedResume} />
            )}
            {$resume.enhancedResume && (
              <ResumeDisplaySection title="Enhanced Resume" content={$resume.enhancedResume} />
            )}
          </CustomTabPanel>
        </Box>
      </Paper>
    </div>
  );
};

export default ResumeGeneratorPage;
