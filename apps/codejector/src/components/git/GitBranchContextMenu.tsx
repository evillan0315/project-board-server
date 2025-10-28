import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import GitBranchIcon from '@mui/icons-material/CallSplit';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import { IGitBranch } from './types/git';

interface GitBranchContextMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  loading: boolean;
  selectedBranch: IGitBranch | null;
  onCheckoutBranch: (branchName: string) => void;
  onDeleteBranch: (branchName: string, force?: boolean) => void;
}

export function GitBranchContextMenu({
  anchorEl,
  open,
  onClose,
  loading,
  selectedBranch,
  onCheckoutBranch,
  onDeleteBranch,
}: GitBranchContextMenuProps) {
  const targetBranch = selectedBranch;

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
      {targetBranch && !targetBranch.current && (
        <MenuItem onClick={() => { onCheckoutBranch(targetBranch.name); onClose(); }} disabled={loading}>
          <ListItemIcon><GitBranchIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Checkout</ListItemText>
        </MenuItem>
      )}
      {targetBranch && (
        <MenuItem onClick={() => { onDeleteBranch(targetBranch.name); onClose(); }} disabled={loading}>
          <ListItemIcon><DeleteForeverIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Delete Branch</ListItemText>
        </MenuItem>
      )}
      {targetBranch && (
        <MenuItem onClick={() => { onDeleteBranch(targetBranch.name, true); onClose(); }} disabled={loading}>
          <ListItemIcon><DeleteForeverIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Force Delete Branch</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );
}
