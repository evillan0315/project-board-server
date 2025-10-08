import React, { useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  useTheme,
  CircularProgress,
} from '@mui/material'; // Import CircularProgress
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { FileEntry } from '@/types/refactored/fileTree'; // Updated import path
import type { IconifyIconPrefix } from '@iconify/types';
import {
  toggleDirExpansion,
  setSelectedFile,
  fileTreeStore,
} from '@/stores/fileTreeStore';
import { useStore } from '@nanostores/react';
import { getFileTypeIcon } from '@/constants/fileIcons'; // Import the new utility
import { NamePrefixSvgIcon } from '@/components/NamePrefixSvgIcon';
import { getCodeMirrorLanguage } from '@/utils/index';
interface FileTreeItemProps {
  fileEntry: FileEntry;
  projectRoot: string;
  onContextMenu: (event: React.MouseEvent, node: FileEntry) => void; // Add context menu prop
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  fileEntry,
  projectRoot,
  onContextMenu,
}) => {
  const { expandedDirs, selectedFile, loadingChildren } =
    useStore(fileTreeStore);
  const theme = useTheme();
  const isExpanded = expandedDirs.has(fileEntry.path);
  const isSelected = selectedFile === fileEntry.path;
  const isCurrentlyLoadingChildren = loadingChildren.has(fileEntry.path); // Check if this specific folder's children are loading

  const handleToggleIconClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent the parent Box's onClick from firing
    if (fileEntry.type === 'folder') {
      toggleDirExpansion(fileEntry.path);
    }
    // If it's a file, clicking the icon (which shouldn't be there visually) does nothing
  };

  const handleItemClick = useCallback(() => {
    if (fileEntry.type === 'folder') {
      toggleDirExpansion(fileEntry.path);
    } else {
      setSelectedFile(fileEntry.path);
    }
  }, [fileEntry.type, fileEntry.path]);

  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      onContextMenu(event, fileEntry);
    },
    [onContextMenu, fileEntry],
  );

  const levelPadding = (fileEntry.depth || 0) * 16; // 16px per depth level

  const textColor = theme.palette.text.primary;
  const selectedBgColor =
    theme.palette.mode === 'dark'
      ? theme.palette.primary.dark
      : theme.palette.primary.light;
  const hoverBgColor =
    theme.palette.mode === 'dark'
      ? theme.palette.grey[800]
      : theme.palette.grey[200];

  return (
    <Box>
      <Box
        className="flex items-center cursor-pointer select-none rounded-md"
        sx={{
          minHeight: '28px',
          paddingLeft: `${levelPadding}px`,
          bgcolor: isSelected ? selectedBgColor : 'transparent',
          '&:hover': {
            bgcolor: isSelected ? selectedBgColor : hoverBgColor,
          },
          color: isSelected ? theme.palette.primary.contrastText : textColor,
          transition: 'background-color 0.15s ease-in-out',
        }}
        onClick={handleItemClick}
        onContextMenu={handleContextMenu} // Attach context menu handler
      >
        {/* Fixed-width slot for expand/collapse icon or a spacing placeholder */}
        <Box
          sx={{
            width: 24, // Consistent width for the toggle/placeholder area
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {fileEntry.type === 'folder' ? (
            <IconButton
              size="small"
              onClick={handleToggleIconClick}
              sx={{
                color: isSelected
                  ? theme.palette.primary.contrastText
                  : textColor,
                p: 0,
              }}
            >
              {isCurrentlyLoadingChildren ? (
                <CircularProgress size={16} color="inherit" /> // Show spinner if loading children
              ) : isExpanded ? (
                <ExpandMoreIcon fontSize="inherit" />
              ) : (
                <ChevronRightIcon fontSize="inherit" />
              )}
            </IconButton>
          ) : (
            // Files get a spacer to align their icons/names with directories
            <Box sx={{ width: 24, height: 24 }} />
          )}
        </Box>

        {/* Fixed-width slot for file/folder type icon */}
        <Box
          sx={{
            width: 20, // Consistent width for the file/folder icon
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 0.5,
            flexShrink: 0,
            color: isSelected
              ? theme.palette.primary.contrastText
              : theme.palette.text.secondary,
          }}
        >
          {getFileTypeIcon(fileEntry.name, fileEntry.type, isExpanded)}
        </Box>

        {/* File/Folder Name */}
        <Typography
          variant="body2"
          sx={{
            ml: 0.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flexGrow: 1,
          }}
        >
          {fileEntry.name}
        </Typography>
      </Box>
      {fileEntry.type === 'folder' &&
        isExpanded &&
        fileEntry.isChildrenLoaded && (
          <Box sx={{ pl: 0 }}>
            {' '}
            {/* Children handle their own paddingLeft */}
            {fileEntry.children.map((child) => (
              <FileTreeItem
                key={child.path}
                fileEntry={child}
                projectRoot={projectRoot}
                onContextMenu={onContextMenu} // Pass context menu handler to children
              />
            ))}
          </Box>
        )}
      {fileEntry.type === 'folder' &&
        isExpanded &&
        !fileEntry.isChildrenLoaded &&
        isCurrentlyLoadingChildren && (
          <Box
            sx={{
              pl: `${levelPadding + 24}px`,
              py: 0.5,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <CircularProgress
              size={16}
              sx={{ mr: 1, color: theme.palette.text.secondary }}
            />
            <Typography variant="caption" color="text.secondary">
              Loading...
            </Typography>
          </Box>
        )}
    </Box>
  );
};

export default FileTreeItem;
