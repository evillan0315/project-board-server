import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import { useStore } from '@nanostores/react';
import { plannerStore, setUserPrompt, setIsLoading, setError, setPlan, resetPlannerState } from './stores/plannerStore';
import { plannerService } from './api/plannerService';
import PlanDisplay from './PlanDisplay';
import { LlmInput } from './types';

const styles = {
  card: {
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    borderRadius: '12px',
  },
  formSection: {
    padding: 3,
  },
  generateButton: {
    marginTop: 2,
    marginBottom: 2,
  },
};

const PlanGenerator: React.FC = () => {
  const { userPrompt, plan, isLoading, error } = useStore(plannerStore);

  const handleGeneratePlan = async () => {
    if (!userPrompt.trim()) {
      setError('Please enter a prompt to generate a plan.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPlan(null, null); // Clear previous plan

    try {
      const llmInput: LlmInput = { userPrompt };
      const response = await plannerService.generatePlan(llmInput);
      setPlan(response.planId, response.plan);
    } catch (err: any) {
      setError(err.message || 'Failed to generate plan.');
      setPlan(null, null); // Clear plan on error
    }
  };

  const handleClearPlan = () => {
    resetPlannerState();
  };

  return (
    <Box className='flex flex-col h-full overflow-hidden p-4 sm:p-6 lg:p-8'>
      <Typography variant='h4' component='h1' gutterBottom className='text-primary-light font-bold mb-6'>
        AI Plan Generator
      </Typography>

      <Card sx={styles.card} className='mb-6 flex-shrink-0'>
        <CardContent sx={styles.formSection}>
          <Typography variant='h6' gutterBottom className='text-text-primary'>Generate a New Plan</Typography>
          <TextField
            label='Enter your prompt for the AI'
            multiline
            rows={6}
            fullWidth
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            variant='outlined'
            disabled={isLoading}
            sx={{ mb: 2 }}
          />
          <Box className='flex justify-end gap-2'>
            <Button
              variant='outlined'
              color='secondary'
              onClick={handleClearPlan}
              disabled={isLoading && !plan}
            >
              Clear Plan
            </Button>
            <Button
              variant='contained'
              color='primary'
              onClick={handleGeneratePlan}
              disabled={isLoading || !userPrompt.trim()}
              startIcon={isLoading && <CircularProgress size={20} color='inherit' />}
              sx={styles.generateButton}
            >
              {isLoading ? 'Generating Plan...' : 'Generate Plan'}
            </Button>
          </Box>

          {error && (
            <Alert severity='error' sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {plan && (
        <Box className='flex-grow overflow-y-auto pt-4'>
          <PlanDisplay plan={plan} />
        </Box>
      )}
    </Box>
  );
};

export default PlanGenerator;
