import React from 'react';
import { Box, Typography, TextField, useTheme, IconButton } from '@mui/material';
import {
  ArrowUpward as ArrowUpwardIcon,
  Refresh as RefreshIcon,
  NoteAdd as NoteAddIcon, // Import for new file icon
  CreateNewFolder as CreateNewFolderIcon, // Import for new folder icon
} from '@mui/icons-material';
import PageHeader from '@/components/layouts/PageHeader';
import GlobalActionButton, {
  type GlobalAction,
} from '@/components/ui/GlobalActionButton';
import {truncateFilePath} from '@/utils/fileUtils';

interface FileTreeHeaderProps {
  projectRoot: string;
  isFetchingTree: boolean;
  searchTerm: string;
  onGoUpDirectory: () => void;
  onRefreshTree: () => void;
  onAddFileFolder: (type: 'file' | 'folder', path: string) => void; // New prop for adding file/folder
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileTreeHeader: React.FC<FileTreeHeaderProps> = ({
  projectRoot,
  isFetchingTree,
  searchTerm,
  onGoUpDirectory,
  onRefreshTree,
  onAddFileFolder,
  onSearchChange,
}) => {
  const theme = useTheme();

  // Create the title element for PageHeader, including the "Go Up" button and search TextField
  const pageHeaderTitle = (
    <Box className="flex items-center gap-2 w-full ">
      <IconButton
        onClick={onGoUpDirectory}
        disabled={projectRoot === '/'}
        size="small"
        sx={{ color: theme.palette.text.secondary, p: 0.5 }}
      >
        <ArrowUpwardIcon fontSize="small" />
      </IconButton>
       <IconButton
        onClick={onRefreshTree}
        disabled={isFetchingTree || !projectRoot}
        size="small"
        sx={{ color: theme.palette.text.secondary, p: 0.5 }}
      >
        <RefreshIcon fontSize="small" />
      </IconButton>
      <TextField
        size="small"
        placeholder={`Search in ${truncateFilePath(projectRoot, 40)}`}
        value={searchTerm}
        onChange={onSearchChange}
        className="flex-grow"
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          '& .MuiOutlinedInput-root': {
            padding: '4px 8px',
            '& fieldset': { border: 'none' },
            '&:hover fieldset': { border: 'none' },
            '&.Mui-focused fieldset': { border: 'none' },
          },
          '& .MuiInputBase-input': {
            padding: '0',
          },
        }}
      />
    </Box>
  );

  // Create the actions array for PageHeader
  const pageHeaderActions: GlobalAction[] = [
    {
      id: 'add-file',
      icon: <NoteAddIcon />,
      label: 'New File',
      action: () => onAddFileFolder('file', projectRoot),
      disabled: isFetchingTree || !projectRoot,
    },
    {
      id: 'add-folder',
      icon: <CreateNewFolderIcon />,
      label: 'New Folder',
      action: () => onAddFileFolder('folder', projectRoot),
      disabled: isFetchingTree || !projectRoot,
    },
  ];

  return (
    
    <PageHeader
      title={pageHeaderTitle}
      actions={pageHeaderActions}
      sticky // Keep sticky behavior
      sx={{px:1}}
      iconOnly={true}
    />
  );
};

export default FileTreeHeader;
