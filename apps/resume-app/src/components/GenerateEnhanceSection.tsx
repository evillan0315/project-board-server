import React, { useState, useCallback, useEffect } from 'react';
import TextField from './ui/TextField';
import Button from './ui/Button';
import CircularProgress from './ui/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import GenerateIcon from '@mui/icons-material/AutoAwesome';
import EnhanceIcon from '@mui/icons-material/Tune';

interface GenerateEnhanceSectionProps {
  onGenerate: (prompt: string) => Promise<void>;
  onEnhance: (content: string, section?: string, goal?: string) => Promise<void>;
  loading: { generate: boolean; enhance: boolean };
  currentResumeContent: string;
}

const GenerateEnhanceSection: React.FC<GenerateEnhanceSectionProps> = ({
  onGenerate,
  onEnhance,
  loading,
  currentResumeContent,
}) => {
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [enhanceContent, setEnhanceContent] = useState('');
  const [enhanceSection, setEnhanceSection] = useState('');
  const [enhancementGoal, setEnhancementGoal] = useState('');

  // Sync enhanceContent with currentResumeContent from store
  useEffect(() => {
    setEnhanceContent(currentResumeContent);
  }, [currentResumeContent]);

  const handleGenerateClick = useCallback(async () => {
    if (generatePrompt.trim()) {
      await onGenerate(generatePrompt);
    }
  }, [generatePrompt, onGenerate]);

  const handleEnhanceClick = useCallback(async () => {
    if (enhanceContent.trim()) {
      await onEnhance(enhanceContent, enhanceSection || undefined, enhancementGoal || undefined);
    } else {
      alert('Please provide resume content to enhance.');
    }
  }, [enhanceContent, enhanceSection, enhancementGoal, onEnhance]);

  return (
    <Box className="flex flex-col gap-6">
      <Box className="p-4 border border-gray-200 rounded-lg shadow-sm">
        <Typography
          variant="h6"
          className="!font-semibold !text-gray-800 flex items-center gap-2 mb-4"
        >
          <GenerateIcon /> Generate New Resume
        </Typography>
        <TextField
          label="Generate Resume Prompt"
          multiline
          rows={6}
          value={generatePrompt}
          onChange={(e) => setGeneratePrompt(e.target.value)}
          placeholder="E.g., 'Generate a resume for a junior full-stack developer with 2 years of experience in React and Node.js. Include a project section for an e-commerce site.'"
          className="w-full mb-4"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerateClick}
          disabled={loading.generate || !generatePrompt.trim()}
          className="!bg-purple-600 hover:!bg-purple-700 !text-white !py-2 !text-md !font-bold"
          startIcon={loading.generate && <CircularProgress size={20} color="inherit" />}
        >
          {loading.generate ? 'Generating...' : 'Generate Resume'}
        </Button>
      </Box>

      <Box className="p-4 border border-gray-200 rounded-lg shadow-sm mt-4">
        <Typography
          variant="h6"
          className="!font-semibold !text-gray-800 flex items-center gap-2 mb-4"
        >
          <EnhanceIcon /> Enhance Existing Resume
        </Typography>
        <TextField
          label="Resume Content to Enhance"
          multiline
          rows={10}
          value={enhanceContent}
          onChange={(e) => setEnhanceContent(e.target.value)}
          placeholder="Paste your resume content here, or it will use the current loaded resume."
          className="w-full mb-4"
        />
        <TextField
          label="Specific Section to Enhance (Optional)"
          value={enhanceSection}
          onChange={(e) => setEnhanceSection(e.target.value)}
          placeholder="E.g., 'Summary', 'Experience', 'Skills'"
          className="w-full mb-4"
        />
        <TextField
          label="Enhancement Goal (Optional)"
          multiline
          rows={3}
          value={enhancementGoal}
          onChange={(e) => setEnhancementGoal(e.target.value)}
          placeholder="E.g., 'Make more concise with strong action verbs', 'Add quantifiable achievements', 'Target leadership roles'"
          className="w-full mb-4"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleEnhanceClick}
          disabled={loading.enhance || !enhanceContent.trim()}
          className="!bg-teal-600 hover:!bg-teal-700 !text-white !py-2 !text-md !font-bold"
          startIcon={loading.enhance && <CircularProgress size={20} color="inherit" />}
        >
          {loading.enhance ? 'Enhancing...' : 'Enhance Resume'}
        </Button>
      </Box>
    </Box>
  );
};

export default GenerateEnhanceSection;
