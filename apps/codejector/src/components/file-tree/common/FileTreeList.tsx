import React from 'react';
import { Box } from '@mui/material';
import FileTreeItem from '../FileTreeItem';
import { FileEntry } from '@/types/refactored/fileTree';

interface FileTreeListProps {
  treeFiles: FileEntry[];
  projectRoot: string;
  onNodeContextMenu: (event: React.MouseEvent, node: FileEntry) => void;
}

const FileTreeList: React.FC<FileTreeListProps> = ({
  treeFiles,
  projectRoot,
  onNodeContextMenu,
}) => {
  if (!projectRoot) {
    // This case should ideally not happen if projectRoot is always initialized to '/',
    // but keeping a defensive check for robustness or future changes.
    return null; // Or show a message indicating no project root
  }
  return (
    <Box className="flex-grow h-full">
      {treeFiles.map((entry) => (
        <FileTreeItem
          key={entry.path}
          fileEntry={entry}
          projectRoot={projectRoot}
          onContextMenu={onNodeContextMenu}
        />
      ))}
    </Box>
  );
};

export default FileTreeList;
