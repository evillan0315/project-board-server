import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import { IGitCommit } from './types/git';

interface GitCommitContextMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  loading: boolean;
  selectedCommit: IGitCommit | null;
  onRevertCommit: (commitHash: string) => void;
  onResetHard: (commitHash: string) => void;
}

export function GitCommitContextMenu({
  anchorEl,
  open,
  onClose,
  loading,
  selectedCommit,
  onRevertCommit,
  onResetHard,
}: GitCommitContextMenuProps) {
  const targetCommitHash = selectedCommit?.hash || '';

  return (
    <Menu
      open={open}
      onClose={onClose}
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
    >
      {targetCommitHash && (
        <MenuItem onClick={() => { onRevertCommit(targetCommitHash); onClose(); }} disabled={loading}>
          <ListItemIcon><RestoreIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Revert Commit</ListItemText>
        </MenuItem>
      )}
      {targetCommitHash && (
        <MenuItem onClick={() => { onResetHard(targetCommitHash); onClose(); }} disabled={loading}>
          <ListItemIcon><DeleteForeverIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Reset (Hard)</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );
}
