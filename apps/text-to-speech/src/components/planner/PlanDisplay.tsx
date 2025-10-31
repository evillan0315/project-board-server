import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Button,
  CircularProgress,
  Link as MuiLink,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { plannerStore, setApplyStatus } from './stores/plannerStore';
import { plannerService } from './api/plannerService';
import { IPlan } from './types'; // Updated import

interface PlanDisplayProps {
  plan: IPlan; // Updated prop type
}

const styles = {
  card: {
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    borderRadius: '12px',
  },
  sectionTitle: {
    marginBottom: 1,
    color: 'primary.main',
    fontWeight: 'bold',
  },
  tableContainer: {
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tableHeadCell: {
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  codeBlock: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 2,
    borderRadius: '8px',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    maxHeight: '300px',
    overflowY: 'auto',
    color: 'text.secondary',
  },
};

const PlanDisplay: React.FC<PlanDisplayProps> = ({ plan }) => {
  const { applyStatus, applyError } = useStore(plannerStore);

  const handleApplyPlan = async () => {
    if (!plan || !plan.id) { // Use plan.id instead of plan.planId
      setApplyStatus('failure', 'No plan available to apply or plan ID is missing.');
      return;
    }
    setApplyStatus('applying');
    try {
      const result = await plannerService.applyPlan(plan); // Pass the entire plan object
      if (result.ok) {
        setApplyStatus('success');
      } else {
        setApplyStatus('failure', result.error || 'Failed to apply plan.');
      }
    } catch (err: any) {
      setApplyStatus('failure', err.message || 'An unexpected error occurred during application.');
    } finally {
      // Ensure loading state is reset
    }
  };

  return (
    <Box className='space-y-6'>
      <Card sx={styles.card}>
        <CardContent>
          <Typography variant='h5' component='h2' gutterBottom sx={styles.sectionTitle}>
            {plan.title}
          </Typography>
          {plan.summary && (
            <Typography variant='body1' paragraph color='text.secondary'>
              {plan.summary}
            </Typography>
          )}
          {plan.thoughtProcess && (
            <Box mb={2}>
              <Typography variant='h6' sx={styles.sectionTitle}>Thought Process</Typography>
              <Typography variant='body2' color='text.secondary' sx={styles.codeBlock}>
                {plan.thoughtProcess}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {plan.documentation && (
        <Card sx={styles.card}>
          <CardContent>
            <Typography variant='h6' sx={styles.sectionTitle}>Documentation</Typography>
            <Typography variant='body2' color='text.secondary' sx={styles.codeBlock}>
              {plan.documentation}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Card sx={styles.card}>
        <CardContent>
          <Typography variant='h6' sx={styles.sectionTitle}>File Changes ({plan.changes.length})</Typography>
          {plan.changes.length > 0 ? (
            <TableContainer sx={styles.tableContainer} className='max-h-[400px]'>
              <Table stickyHeader size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell sx={styles.tableHeadCell}>File Path</TableCell>
                    <TableCell sx={styles.tableHeadCell}>Action</TableCell>
                    <TableCell sx={styles.tableHeadCell}>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {plan.changes.map((change, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{change.filePath}</TableCell>
                      <TableCell>
                        <Chip
                          label={change.action}
                          color={
                            change.action === 'ADD'
                              ? 'success'
                              : change.action === 'MODIFY'
                              ? 'info'
                              : change.action === 'DELETE'
                              ? 'error'
                              : 'default'
                          }
                          size='small'
                        />
                      </TableCell>
                      <TableCell>{change.reason || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant='body2' color='text.secondary'>No file changes proposed.</Typography>
          )}
        </CardContent>
      </Card>

      {plan.gitInstructions && plan.gitInstructions.length > 0 && (
        <Card sx={styles.card}>
          <CardContent>
            <Typography variant='h6' sx={styles.sectionTitle}>Git Instructions</Typography>
            <Box sx={styles.codeBlock}>
              {plan.gitInstructions.map((instruction, index) => (
                <Typography key={index} variant='body2' color='text.secondary'>
                  {instruction}
                </Typography>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      <Box className='flex justify-end p-4'>
        <Button
          variant='contained'
          color='primary'
          onClick={handleApplyPlan}
          disabled={applyStatus === 'applying'}
          startIcon={applyStatus === 'applying' && <CircularProgress size={20} color='inherit' />}
        >
          {applyStatus === 'applying' ? 'Applying Plan...' : 'Apply Plan'}
        </Button>
      </Box>

      {applyStatus === 'success' && (
        <Alert severity='success' className='mt-4'>Plan applied successfully! Please check your project directory.</Alert>
      )}
      {applyStatus === 'failure' && (
        <Alert severity='error' className='mt-4'>Error applying plan: {applyError}</Alert>
      )}
    </Box>
  );
};

export default PlanDisplay;
