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
  Chip,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import RestoreIcon from '@mui/icons-material/Restore';

import { GitCommit } from './types/git';

interface GitCommitsSectionProps {
  commits: GitCommit[];
  loading: boolean;
  onRevertCommit: (commitHash: string) => void;
  onCommitContextMenu: (event: React.MouseEvent, commit: GitCommit) => void;
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

export function GitCommitsSection({
  commits,
  loading,
  onRevertCommit,
  onCommitContextMenu,
}: GitCommitsSectionProps) {
  return (
    <Box className="flex flex-col gap-4 mt-4">
      <Paper sx={sectionPaperSx}>
        <Typography variant="h6" className="mb-2">Commit History</Typography>
        <List dense className="flex-grow overflow-auto border rounded-md border-gray-300 dark:border-gray-700">
          {commits.length === 0 && <ListItem><ListItemText primary="No commits found" /></ListItem>}
          {commits.map((commit) => (
            <ListItem
              key={commit.hash}
              onContextMenu={(e) => onCommitContextMenu(e, commit)}
            >
              <ListItemIcon>
                <HistoryIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={commit.message}
                secondary={
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={commit.hash.substring(0, 7)} size="small" />
                    <Typography variant="caption">{commit.author_name}</Typography>
                    <Typography variant="caption">{new Date(commit.date).toLocaleString()}</Typography>
                  </Box>
                }
              />
              <Button size="small" onClick={() => onRevertCommit(commit.hash)} disabled={loading}>
                Revert
              </Button>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
