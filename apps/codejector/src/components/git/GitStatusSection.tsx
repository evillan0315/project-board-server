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
import RemoveIcon from '@mui/icons-material/Remove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import { GitStatusResult } from './types/git';

interface GitStatusSectionProps {
  status: GitStatusResult | null;
  loading: boolean;
  selectedStagedFiles: string[];
  setSelectedStagedFiles: React.Dispatch<React.SetStateAction<string[]>>;
  selectedUnstagedFiles: string[];
  setSelectedUnstagedFiles: React.Dispatch<React.SetStateAction<string[]>>;
  onStageSelected: (files?: string[]) => Promise<void>;
  onUnstageSelected: (files?: string[]) => Promise<void>;
  onFileContextMenu: (event: React.MouseEvent, file: string) => void;
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

const statusItemTextSx = {
  fontSize: '0.9rem',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
};

export function GitStatusSection({
  status,
  loading,
  selectedStagedFiles,
  setSelectedStagedFiles,
  selectedUnstagedFiles,
  setSelectedUnstagedFiles,
  onStageSelected,
  onUnstageSelected,
  onFileContextMenu,
}: GitStatusSectionProps) {
  const handleFileSelection = (filePath: string, type: 'staged' | 'unstaged') => {
    if (type === 'staged') {
      setSelectedStagedFiles((prev) =>
        prev.includes(filePath) ? prev.filter((f) => f !== filePath) : [...prev, filePath]
      );
    }
    if (type === 'unstaged') {
      setSelectedUnstagedFiles((prev) =>
        prev.includes(filePath) ? prev.filter((f) => f !== filePath) : [...prev, filePath]
      );
    }
  };

  return (
    <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {/* Staged Files */}
      <Paper sx={sectionPaperSx}>
        <Typography variant="h6" className="flex items-center gap-2 mb-2">Staged Changes <CheckCircleIcon color="success" fontSize="small" /></Typography>
        <List dense className="flex-grow overflow-auto border rounded-md border-gray-300 dark:border-gray-700">
          {status?.staged.length === 0 && <ListItem><ListItemText primary="No staged changes" /></ListItem>}
          {status?.staged.map((file) => (
            <ListItem
              key={file}
              className={`${selectedStagedFiles.includes(file) ? 'bg-blue-100 dark:bg-blue-900' : ''} hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer`}
              onClick={() => handleFileSelection(file, 'staged')}
              onContextMenu={(e) => onFileContextMenu(e, file)}
            >
              <ListItemIcon>
                <RemoveIcon color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={file}
                primaryTypographyProps={{ sx: statusItemTextSx }}
              />
            </ListItem>
          ))}
        </List>
        <Box className="flex justify-end gap-2 mt-2">
          <Button
            variant="outlined"
            color="warning"
            startIcon={<RemoveIcon />}
            onClick={() => onUnstageSelected()}
            disabled={selectedStagedFiles.length === 0 || loading}
          >
            Unstage Selected
          </Button>
        </Box>
      </Paper>

      {/* Unstaged Files */}
      <Paper sx={sectionPaperSx}>
        <Typography variant="h6" className="flex items-center gap-2 mb-2">Unstaged Changes <CancelIcon color="warning" fontSize="small" /></Typography>
        <List dense className="flex-grow overflow-auto border rounded-md border-gray-300 dark:border-gray-700">
          {status?.modified.length === 0 && status?.not_added.length === 0 && status?.deleted.length === 0 && <ListItem><ListItemText primary="No unstaged changes" /></ListItem>}
          {status?.modified.map((file) => (
            <ListItem
              key={file}
              className={`${selectedUnstagedFiles.includes(file) ? 'bg-blue-100 dark:bg-blue-900' : ''} hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer`}
              onClick={() => handleFileSelection(file, 'unstaged')}
              onContextMenu={(e) => onFileContextMenu(e, file)}
            >
              <ListItemIcon>
                <DriveFileMoveIcon color="info" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={`${file} (Modified)`}
                primaryTypographyProps={{ sx: statusItemTextSx }}
              />
            </ListItem>
          ))}
          {status?.not_added.map((file) => (
            <ListItem
              key={file}
              className={`${selectedUnstagedFiles.includes(file) ? 'bg-blue-100 dark:bg-blue-900' : ''} hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer`}
              onClick={() => handleFileSelection(file, 'unstaged')}
              onContextMenu={(e) => onFileContextMenu(e, file)}
            >
              <ListItemIcon>
                <AddIcon color="primary" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={`${file} (Untracked)`}
                primaryTypographyProps={{ sx: statusItemTextSx }}
              />
            </ListItem>
          ))}
          {status?.deleted.map((file) => (
            <ListItem
              key={file}
              className={`${selectedUnstagedFiles.includes(file) ? 'bg-blue-100 dark:bg-blue-900' : ''} hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer`}
              onClick={() => handleFileSelection(file, 'unstaged')}
              onContextMenu={(e) => onFileContextMenu(e, file)}
            >
              <ListItemIcon>
                <DeleteForeverIcon color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={`${file} (Deleted)`}
                primaryTypographyProps={{ sx: statusItemTextSx }}
              />
            </ListItem>
          ))}
        </List>
        <Box className="flex justify-end gap-2 mt-2">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => onStageSelected()}
            disabled={selectedUnstagedFiles.length === 0 || loading}
          >
            Stage Selected
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
