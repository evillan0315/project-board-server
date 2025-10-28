import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GitBranchIcon from '@mui/icons-material/CallSplit';

import { IGitBranch } from './types/git';

interface GitBranchesSectionProps {
  branches: IGitBranch[];
  loading: boolean;
  onCreateBranchClick: () => void;
  onCheckoutBranch: (branchName: string) => void;
  onBranchContextMenu: (event: React.MouseEvent, branch: IGitBranch) => void;
}

const sectionPaperSx = {
  p: 2,
  mb: 3,
  borderRadius: 2,
  backgroundColor: (theme: any) =>
    theme.palette.mode === 'dark' ? '#2c2c2c' : '#f0f0f0',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  minHeight: '200px',
  display: 'flex',
  flexDirection: 'column',
};

export function GitBranchesSection({
  branches,
  loading,
  onCreateBranchClick,
  onCheckoutBranch,
  onBranchContextMenu,
}: GitBranchesSectionProps) {
  return (
    <Box className="flex flex-col gap-4 mt-4">
      <Paper sx={sectionPaperSx}>
        <Box className="flex justify-between items-center mb-2">
          <Typography variant="h6">Branches</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={onCreateBranchClick} disabled={loading}>
            New Branch
          </Button>
        </Box>
        <List dense className="flex-grow overflow-auto border rounded-md border-gray-300 dark:border-gray-700">
          {branches.length === 0 && <ListItem><ListItemText primary="No branches found" /></ListItem>}
          {branches.map((branch) => (
            <ListItem
              key={branch.name}
              className={`${branch.current ? 'bg-green-100 dark:bg-green-900' : ''} hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer`}
              onContextMenu={(e) => onBranchContextMenu(e, branch)}
            >
              <ListItemIcon>
                <GitBranchIcon color={branch.current ? 'success' : 'action'} fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={`${branch.name}${branch.current ? ' (current)' : ''}`}
                secondary={branch.commit}
              />
              {!branch.current && (
                <Button size="small" onClick={() => onCheckoutBranch(branch.name)} disabled={loading}>
                  Checkout
                </Button>
              )}
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
