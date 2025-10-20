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
  contextMenu: { mouseX: number; mouseY: number; snapshot: string } | null;
  onClose: () => void;
  loading: boolean;
  onRestoreSnapshot: (snapshotName: string) => Promise<void>;
  onDeleteSnapshot: (snapshotName: string) => void;
}

export function GitSnapshotContextMenu({
  contextMenu,
  onClose,
  loading,
  onRestoreSnapshot,
  onDeleteSnapshot,
}: GitSnapshotContextMenuProps) {
  const targetSnapshot = contextMenu?.snapshot || '';

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
