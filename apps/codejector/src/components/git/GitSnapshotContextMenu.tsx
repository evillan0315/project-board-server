import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

interface GitSnapshotContextMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  loading: boolean;
  selectedSnapshot: string | null;
  onRestoreSnapshot: (snapshotName: string) => void;
  onDeleteSnapshot: (snapshotName: string) => void;
}

export function GitSnapshotContextMenu({
  anchorEl,
  open,
  onClose,
  loading,
  selectedSnapshot,
  onRestoreSnapshot,
  onDeleteSnapshot,
}: GitSnapshotContextMenuProps) {
  const targetSnapshot = selectedSnapshot;

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
      {targetSnapshot && (
        <MenuItem onClick={() => { onRestoreSnapshot(targetSnapshot); onClose(); }} disabled={loading}>
          <ListItemIcon><RestoreIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Restore Snapshot</ListItemText>
        </MenuItem>
      )}
      {targetSnapshot && (
        <MenuItem onClick={() => { onDeleteSnapshot(targetSnapshot); onClose(); }} disabled={loading}>
          <ListItemIcon><DeleteForeverIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Delete Snapshot</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );
}
