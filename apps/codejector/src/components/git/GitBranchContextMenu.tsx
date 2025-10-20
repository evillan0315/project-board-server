import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import GitBranchIcon from '@mui/icons-material/CallSplit';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import { GitBranch } from '@/stores/gitStore';

interface GitBranchContextMenuProps {
  contextMenu: { mouseX: number; mouseY: number; branch: GitBranch } | null;
  onClose: () => void;
  loading: boolean;
  onCheckoutBranch: (branchName: string) => void;
  onDeleteBranch: (branchName: string, force?: boolean) => Promise<void>;
}

export function GitBranchContextMenu({
  contextMenu,
  onClose,
  loading,
  onCheckoutBranch,
  onDeleteBranch,
}: GitBranchContextMenuProps) {
  const targetBranch = contextMenu?.branch;

  return (
    <Menu
      open={contextMenu !== null}
      onClose={onClose}
      anchorReference="point"
      anchorPosition={
        contextMenu !== null
          ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
          : undefined
      }
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
