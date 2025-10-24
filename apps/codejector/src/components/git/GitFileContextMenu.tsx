import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CodeIcon from '@mui/icons-material/Code';
import UndoIcon from '@mui/icons-material/Undo';

import { GitStatusResult } from './types/git';

interface GitFileContextMenuProps {
  contextMenu: { mouseX: number; mouseY: number; file: string } | null;
  onClose: () => void;
  loading: boolean;
  status: GitStatusResult | null;
  onViewDiff: (filePath: string) => Promise<void>;
  onStageFiles: (files?: string[]) => Promise<void>;
  onUnstageFiles: (files?: string[]) => Promise<void>;
  onDiscardChanges: (filePath: string) => Promise<void>;
}

export function GitFileContextMenu({
  contextMenu,
  onClose,
  loading,
  status,
  onViewDiff,
  onStageFiles,
  onUnstageFiles,
  onDiscardChanges,
}: GitFileContextMenuProps) {
  const targetFile = contextMenu?.file || '';
  const isNotAdded = status?.not_added.includes(targetFile);
  const isModified = status?.modified.includes(targetFile);
  const isDeleted = status?.deleted.includes(targetFile); // Changed to 'includes' based on backend DTO
  const isStaged = status?.staged.includes(targetFile);

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
      {/* View Diff */}
      {(isModified || isDeleted) && (
        <MenuItem onClick={() => { onViewDiff(targetFile); onClose(); }} disabled={loading}>
          <ListItemIcon><CodeIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View Diff</ListItemText>
        </MenuItem>
      )}

      {/* Stage File */}
      {(isNotAdded || isModified) && !isStaged && (
        <MenuItem onClick={() => { onStageFiles([targetFile]); onClose(); }} disabled={loading}>
          <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Stage File</ListItemText>
        </MenuItem>
      )}

      {/* Unstage File */}
      {isStaged && (
        <MenuItem onClick={() => { onUnstageFiles([targetFile]); onClose(); }} disabled={loading}>
          <ListItemIcon><RemoveIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Unstage File</ListItemText>
        </MenuItem>
      )}

      {/* Discard Changes */}
      {(isModified || isDeleted) && (
        <MenuItem onClick={() => { onDiscardChanges(targetFile); onClose(); }} disabled={loading}>
          <ListItemIcon><UndoIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Discard Changes</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );
}
