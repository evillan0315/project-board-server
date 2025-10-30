import React, { useState } from 'react';
import { Box, Typography, TextareaAutosize, Chip } from '@mui/material';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { projectPlannerService } from '@/api/projectPlannerService';
import { showSnackbar } from '@/stores/snackbarStore';
import { setIsLoading, setCurrentPlan, setError } from '@/stores/plannerStore';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import { ILlmInputDto } from '@/types/planner';

export const PlanGenerator: React.FC = () => {
  const { token } = useStore(authStore);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [projectRoot, setProjectRoot] = useState<string>('');
  const [scanPaths, setScanPaths] = useState<string>('');
  const [additionalInstructions, setAdditionalInstructions] = useState<string>('');
  const [expectedOutputFormat, setExpectedOutputFormat] = useState<string>(
    'You are an expert full-stack developer in TypeScript, React, Node.js, NestJS, and Prisma. Respond only with a JSON object that strictly adheres to the provided JSON schema. Ensure all fields are correctly typed. Do not include any additional text or markdown outside the JSON. The `changes` array should include all necessary modifications, additions, or deletions to files to implement the request. If no changes are needed, provide an empty `changes` array. Your response will be directly parsed as JSON.',
  );

  const handleGeneratePlan = async () => {
    if (!token) {
      showSnackbar('You must be logged in to generate a plan.', 'error');
      return;
    }
    if (!userPrompt.trim()) {
      showSnackbar('User prompt cannot be empty.', 'error');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentPlan(null);

    const llmInput: ILlmInputDto = {
      userPrompt,
      projectRoot: projectRoot || './',
      scanPaths: scanPaths.split(',').map(s => s.trim()).filter(Boolean),
      additionalInstructions,
      expectedOutputFormat,
      requestType: 'LLM_GENERATION',
    };

    try {
      const response = await projectPlannerService.generatePlan(llmInput, token);
      setCurrentPlan(response.plan);
      showSnackbar('Plan generated successfully!', 'success');
    } catch (err) {
      console.error('Error generating plan:', err);
      setError((err as Error).message);
      showSnackbar(`Failed to generate plan: ${(err as Error).message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const sxField = {
    mb: 2,
    '& .MuiInputBase-root': {
      borderRadius: '8px',
    },
  };

  return (
    <Box className='space-y-4'>
      <Typography variant='h5' component='h2' gutterBottom>
        Generate a New Project Plan
      </Typography>
      <TextField
        label='Your Prompt (e.g., "Add a new feature to the user profile page")'
        value={userPrompt}
        onChange={(e) => setUserPrompt(e.target.value)}
        multiline
        rows={4}
        sx={sxField}
        InputLabelProps={{ shrink: true }}
        placeholder='Describe the feature or task you want to implement. Provide as much detail as possible.'
      />
      <TextField
        label='Project Root (optional, e.g., "/path/to/my/repo")'
        value={projectRoot}
        onChange={(e) => setProjectRoot(e.target.value)}
        sx={sxField}
        InputLabelProps={{ shrink: true }}
        placeholder='Defaults to the backend's configured base directory. Only specify if you need a different root.'
      />
      <TextField
        label='Scan Paths (optional, comma-separated, e.g., "src/components,src/services")'
        value={scanPaths}
        onChange={(e) => setScanPaths(e.target.value)}
        sx={sxField}
        InputLabelProps={{ shrink: true }}
        placeholder='Specify directories or files to scan for context. Leave empty to scan entire project.'
      />
      <TextField
        label='Additional Instructions (optional)'
        value={additionalInstructions}
        onChange={(e) => setAdditionalInstructions(e.target.value)}
        multiline
        rows={2}
        sx={sxField}
        InputLabelProps={{ shrink: true }}
        placeholder='Provide any extra constraints or guidance for the AI.'
      />
      <Box sx={{ mb: 2 }}>
        <Typography variant='subtitle1' sx={{ mb: 1 }}>
          Expected Output Format (System Instruction)
          <Chip label="JSON Schema" color="primary" size="small" sx={{ ml: 1 }} />
        </Typography>
        <TextareaAutosize
          minRows={5}
          maxRows={10}
          value={expectedOutputFormat}
          onChange={(e) => setExpectedOutputFormat(e.target.value)}
          className='w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white'
          placeholder='System instructions for the LLM to format its response. This should typically be a JSON schema.'
        />
      </Box>
      <Button
        variant='contained'
        color='primary'
        onClick={handleGeneratePlan}
        disabled={!userPrompt.trim()}
        sx={{ px: 4, py: 1.5, borderRadius: '8px' }}
      >
        Generate Plan
      </Button>
    </Box>
  );
};
