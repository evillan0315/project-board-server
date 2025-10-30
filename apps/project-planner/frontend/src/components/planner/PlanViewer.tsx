import React from 'react';
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, Divider } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { IPlan } from '@/types/planner';
import { FileChangeCard } from './FileChangeCard';
import { Button } from '../ui/Button';
import { projectPlannerService } from '@/api/projectPlannerService';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import { setIsLoading, setError, setCurrentPlan } from '@/stores/plannerStore';
import { showSnackbar } from '@/stores/snackbarStore';

interface PlanViewerProps {
  plan: IPlan;
}

export const PlanViewer: React.FC<PlanViewerProps> = ({ plan }) => {
  const { token } = useStore(authStore);
  const handleApplyPlan = async () => {
    if (!token) {
      showSnackbar('You must be logged in to apply a plan.', 'error');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await projectPlannerService.applyPlan(plan, token);
      if (response.ok) {
        showSnackbar('Plan applied successfully!', 'success');
      } else {
        throw new Error(response.error || 'Failed to apply plan.');
      }
    } catch (err) {
      console.error('Error applying plan:', err);
      setError((err as Error).message);
      showSnackbar(`Failed to apply plan: ${(err as Error).message}`, 'error');
    } finally {
      setIsLoading(false);
      // Optionally clear the current plan after application
      setCurrentPlan(null);
    }
  };

  return (
    <Box className='space-y-4'>
      <Typography variant='h6' component='h3' gutterBottom>
        Proposed File Changes ({plan.changes.length})
      </Typography>
      {plan.changes.length === 0 ? (
        <Typography variant='body2'>No file changes proposed in this plan.</Typography>
      ) : (
        plan.changes.map((change, index) => (
          <Accordion key={index} elevation={1}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography className='flex-grow' sx={{ fontWeight: 'medium' }}>
                <span className={`text-${change.action === 'ADD' ? 'green-500' : change.action === 'DELETE' ? 'red-500' : 'blue-500'}`}>
                  [{change.action}] 
                </span>
                {change.filePath}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FileChangeCard change={change} />
            </AccordionDetails>
          </Accordion>
        ))
      )}
      {plan.changes.length > 0 && (
        <Box className='flex justify-end pt-4'>
          <Button
            variant='contained'
            color='success'
            onClick={handleApplyPlan}
            sx={{ px: 4, py: 1.5, borderRadius: '8px' }}
          >
            Apply Full Plan
          </Button>
        </Box>
      )}
    </Box>
  );
};
