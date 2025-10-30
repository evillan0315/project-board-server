import React from 'react';
import { Box, Paper, Typography, Divider } from '@mui/material';
import { PlanGenerator } from '@/components/planner/PlanGenerator';
import { PlanViewer } from '@/components/planner/PlanViewer';
import { useStore } from '@nanostores/react';
import { plannerStore } from '@/stores/plannerStore';
import { Loading } from '@/components/Loading';

const PlannerPage: React.FC = () => {
  const { currentPlan, isLoading, error } = useStore(plannerStore);

  return (
    <Box className='p-6 max-w-7xl mx-auto'>
      <Typography variant='h4' component='h1' gutterBottom sx={{ mb: 4 }}>
        AI Project Planner
      </Typography>
      <Paper elevation={3} className='p-6 mb-8'>
        <PlanGenerator />
      </Paper>

      {isLoading && (
        <Box className='flex justify-center items-center h-48'>
          <Loading />
        </Box>
      )}

      {error && (
        <Paper elevation={3} className='p-6 mb-8 bg-red-100 border border-red-400 text-red-700'>
          <Typography variant='h6' color='error' gutterBottom>Error</Typography>
          <Typography>{error}</Typography>
        </Paper>
      )}

      {currentPlan && !isLoading && !error && (
        <Paper elevation={3} className='p-6'>
          <Typography variant='h5' component='h2' gutterBottom sx={{ mb: 2 }}>
            Generated Plan: {currentPlan.title}
          </Typography>
          <Typography variant='body1' paragraph>
            Summary: {currentPlan.summary || 'No summary provided.'}
          </Typography>
          {currentPlan.thoughtProcess && (
            <>
              <Typography variant='subtitle1' sx={{ mt: 2 }}>
                Thought Process:
              </Typography>
              <Typography variant='body2' paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                {currentPlan.thoughtProcess}
              </Typography>
            </>
          )}
          {currentPlan.documentation && (
            <>
              <Typography variant='subtitle1' sx={{ mt: 2 }}>
                Documentation:
              </Typography>
              <Typography variant='body2' paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                {currentPlan.documentation}
              </Typography>
            </>
          )}
          {currentPlan.gitInstructions && currentPlan.gitInstructions.length > 0 && (
            <>
              <Typography variant='subtitle1' sx={{ mt: 2 }}>
                Git Instructions:
              </Typography>
              <ul className='list-disc pl-5'>
                {currentPlan.gitInstructions.map((instruction, index) => (
                  <li key={index} className='font-mono text-sm'>`{instruction}`</li>
                ))}
              </ul>
            </>
          )}
          <Divider sx={{ my: 3 }} />
          <PlanViewer plan={currentPlan} />
        </Paper>
      )}
    </Box>
  );
};

export default PlannerPage;
