import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { resumeStore, resetErrors } from '@/stores/resumeStore';
import { parseResumeFile, optimizeResume, generateResume, enhanceResume, generatePortfolio, generateCoverLetter } from '@/api/resumeApi';
import { exportResume } from '@/api/utilsApi';
import ResumeForm from '@/components/ResumeForm';
import OptimizationDisplaySection from '@/components/OptimizationDisplaySection';
import GenerateEnhanceSection from '@/components/GenerateEnhanceSection';
import ResumeDisplaySection from '@/components/ResumeDisplaySection';
import PortfolioGeneratorSection from '@/components/PortfolioGeneratorSection';
import PortfolioDisplaySection from '@/components/PortfolioDisplaySection';
import DocumentExportSection from '@/components/DocumentExportSection'; // Renamed and modified import
import CoverLetterGeneratorSection from '@/components/CoverLetterGeneratorSection'; // New import
import CoverLetterDisplaySection from '@/components/CoverLetterDisplaySection'; // New import

import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { OutputFormat } from '@/types/resume';

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
      resumeStore.setKey('generatedPortfolioHtml', ''); // Clear portfolio on new parse
      resumeStore.setKey('generatedCoverLetter', ''); // Clear cover letter on new parse
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
      resumeStore.setKey('generatedResume', ''); // Clear other generated content
      resumeStore.setKey('enhancedResume', '');
      resumeStore.setKey('generatedPortfolioHtml', '');
      resumeStore.setKey('generatedCoverLetter', ''); // Clear cover letter
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
      resumeStore.setKey('generatedPortfolioHtml', ''); // Clear portfolio on new generation
      resumeStore.setKey('generatedCoverLetter', ''); // Clear cover letter on new generation
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
      resumeStore.setKey('generatedResume', ''); // Clear other generated content
      resumeStore.setKey('generatedPortfolioHtml', ''); // Clear portfolio on new enhancement
      resumeStore.setKey('generatedCoverLetter', ''); // Clear cover letter on new enhancement
    } catch (err) {
      resumeStore.setKey('error', {
        ...$resume.error,
        enhance: err instanceof Error ? err.message : 'Failed to enhance resume.',
      });
    } finally {
      resumeStore.setKey('loading', { ...$resume.loading, enhance: false });
    }
  };

  const handleGeneratePortfolio = async (resumeContent: string, prompt?: string) => {
    resumeStore.setKey('loading', { ...$resume.loading, portfolio: true });
    resumeStore.setKey('error', { ...$resume.error, portfolio: null, general: null });
    try {
      const generated = await generatePortfolio({
        resumeContent: resumeContent || $resume.parsedResumeText || $resume.resumeContent, // Ensure resume content is passed
        prompt: prompt, // Pass optional prompt
        // conversationId: $resume.generatedPortfolioHtml ? $resume.optimizationResult?.conversationId : undefined, // Optional: reuse conversation ID
      });
      resumeStore.setKey('generatedPortfolioHtml', generated);
      resumeStore.setKey('generatedResume', ''); // Clear other generated content
      resumeStore.setKey('enhancedResume', '');
      resumeStore.setKey('optimizationResult', null); // Clear other generated content
      resumeStore.setKey('generatedCoverLetter', ''); // Clear cover letter
    } catch (err) {
      resumeStore.setKey('error', {
        ...$resume.error,
        portfolio: err instanceof Error ? err.message : 'Failed to generate portfolio.',
      });
    } finally {
      resumeStore.setKey('loading', { ...$resume.loading, portfolio: false });
    }
  };

  const handleGenerateCoverLetter = async (
    resumeContent: string,
    jobDescription: string,
    prompt?: string,
  ) => {
    resumeStore.setKey('loading', { ...$resume.loading, coverLetter: true });
    resumeStore.setKey('error', { ...$resume.error, coverLetter: null, general: null });
    try {
      if (!resumeContent.trim()) {
        throw new Error('Resume content is required to generate a cover letter.');
      }
      if (!jobDescription.trim()) {
        throw new Error('Job description is required to generate a cover letter.');
      }
      const generated = await generateCoverLetter({
        resumeContent: resumeContent,
        jobDescription: jobDescription,
        prompt: prompt,
      });
      resumeStore.setKey('generatedCoverLetter', generated);
      // Clear other generated content when a cover letter is generated
      resumeStore.setKey('generatedResume', '');
      resumeStore.setKey('enhancedResume', '');
      resumeStore.setKey('generatedPortfolioHtml', '');
      resumeStore.setKey('optimizationResult', null);
      resumeStore.setKey('resumeContent', ''); // Optionally clear main resume content if generating a new doc.
    } catch (err) {
      resumeStore.setKey('error', {
        ...$resume.error,
        coverLetter: err instanceof Error ? err.message : 'Failed to generate cover letter.',
      });
    } finally {
      resumeStore.setKey('loading', { ...$resume.loading, coverLetter: false });
    }
  };

  const handleExport = async (content: string, format: OutputFormat, filename: string) => {
    resumeStore.setKey('loading', { ...$resume.loading, export: true });
    resumeStore.setKey('error', { ...$resume.error, export: null, general: null });
    try {
      if (!content.trim()) {
        throw new Error('No content available to export.');
      }
      await exportResume({ content, format, filename });
    } catch (err) {
      resumeStore.setKey('error', {
        ...$resume.error,
        export: err instanceof Error ? err.message : 'Failed to export document.',
      });
    } finally {
      resumeStore.setKey('loading', { ...$resume.loading, export: false });
    }
  };

  const hasError = Object.values($resume.error).some((err) => err !== null);
  const currentErrorMessage =
    $resume.error.parse ||
    $resume.error.optimize ||
    $resume.error.generate ||
    $resume.error.enhance ||
    $resume.error.portfolio ||
    $resume.error.coverLetter || // Add new error to check
    $resume.error.export ||
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

      <Paper elevation={2} className="p-6 transition-colors duration-300">
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              aria-label="resume actions tabs"
              centered
              className="[&_.MuiTabs-indicator]:!bg-blue-600 dark:[&_.MuiTabs-indicator]:!bg-blue-400"
              textColor="inherit"
              indicatorColor="primary"
            >
              <Tab
                label="Upload / Optimize Resume"
                {...a11yProps(0)}
                className="!text-gray-700 dark:!text-gray-300 !font-semibold data-[selected=true]:!text-blue-600 dark:data-[selected=true]:!text-blue-400 transition-colors duration-300"
              />
              <Tab
                label="Generate / Enhance Resume"
                {...a11yProps(1)}
                className="!text-gray-700 dark:!text-gray-300 !font-semibold data-[selected=true]:!text-blue-600 dark:data-[selected=true]:!text-blue-400 transition-colors duration-300"
              />
              <Tab
                label="Generate Portfolio"
                {...a11yProps(2)}
                className="!text-gray-700 dark:!text-gray-300 !font-semibold data-[selected=true]:!text-blue-600 dark:data-[selected=true]:!text-blue-400 transition-colors duration-300"
              />
              <Tab // New Tab for Cover Letter
                label="Generate Cover Letter"
                {...a11yProps(3)}
                className="!text-gray-700 dark:!text-gray-300 !font-semibold data-[selected=true]:!text-blue-600 dark:data-[selected=true]:!text-blue-400 transition-colors duration-300"
              />
              <Tab // New Tab for Export
                label="Export / Convert Document"
                {...a11yProps(4)}
                className="!text-gray-700 dark:!text-gray-300 !font-semibold data-[selected=true]:!text-blue-600 dark:data-[selected=true]:!text-blue-400 transition-colors duration-300"
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
              optimizationResult={$resume.optimizationResult} // Pass optimization result here
            />
            {$resume.generatedResume && (
              <ResumeDisplaySection title="Generated Resume" content={$resume.generatedResume} />
            )}
            {$resume.enhancedResume && (
              <ResumeDisplaySection title="Enhanced Resume" content={$resume.enhancedResume} />
            )}
          </CustomTabPanel>
          <CustomTabPanel value={currentTab} index={2}> {/** Tab Panel for Portfolio */}
            <PortfolioGeneratorSection
              onGeneratePortfolio={handleGeneratePortfolio}
              loading={$resume.loading.portfolio}
              currentResumeContent={$resume.resumeContent}
            />
            {$resume.generatedPortfolioHtml && (
              <PortfolioDisplaySection title="Generated Portfolio" htmlContent={$resume.generatedPortfolioHtml} />
            )}
          </CustomTabPanel>
          <CustomTabPanel value={currentTab} index={3}> {/** New Tab Panel for Cover Letter */}
            <CoverLetterGeneratorSection
              onGenerateCoverLetter={handleGenerateCoverLetter}
              loading={$resume.loading.coverLetter}
              currentResumeContent={$resume.resumeContent}
              currentJobDescription={$resume.jobDescription}
            />
            {$resume.generatedCoverLetter && (
              <CoverLetterDisplaySection title="Generated Cover Letter" content={$resume.generatedCoverLetter} />
            )}
          </CustomTabPanel>
          <CustomTabPanel value={currentTab} index={4}> {/** New Tab Panel for Export */}
            <DocumentExportSection
              onExport={handleExport}
              loading={$resume.loading.export}
              resumeContent={$resume.resumeContent}
              portfolioContent={$resume.generatedPortfolioHtml}
              coverLetterContent={$resume.generatedCoverLetter}
              jobDescription={$resume.jobDescription}
            />
          </CustomTabPanel>
        </Box>
      </Paper>
    </div>
  );
};

export default ResumeGeneratorPage;
