import React, { useEffect, useState, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  useTheme,
  TextField, // Import TextField for the search component
} from '@mui/material';
import FileTreeItem from './FileTreeItem';
import {
  fileTreeStore,
  loadInitialTree,
  clearFileTree,
  loadChildrenForDirectory,
  setSelectedFile,
  projectRootDirectoryStore,
} from '@/stores/fileTreeStore';
import { llmStore, showGlobalSnackbar } from '@/stores/llmStore';
import { projectStore } from '@/stores/projectStore'; // New import

import { ContextMenuItem } from '@/types/main';
import { FileEntry } from '@/types/refactored/fileTree'; // Updated import path
import { showFileTreeContextMenu } from '@/stores/contextMenuStore';
import {
  ContentCopy as ContentCopyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  NoteAdd as NoteAddIcon, // Used for new file
  CreateNewFolder as CreateNewFolderIcon, // Used for new folder
  Terminal as TerminalIcon,
  OpenInNew as OpenInNewIcon,
  Refresh as RefreshIcon,
  DriveFileMove as DriveFileMoveIcon,
  FileCopy as FileCopyIcon,
  ArrowUpward as ArrowUpwardIcon, // Icon for going up a directory
} from '@mui/icons-material';
import FolderOpenIcon from '@mui/icons-material/FolderOpenOutlined';
import { MaterialIconThemeFolderUtils } from '@/components/icons/MaterialIconThemeFolderUtils';
import { MaterialIconThemeFolderPrompts } from '@/components/icons/MaterialIconThemeFolderPrompts';
import { MaterialIconThemeFolderResource } from '@/components/icons/MaterialIconThemeFolderResource';
import { MdiRenameBox } from '@/components/icons/MdiRenameBox';
import { MdiTerminalNetworkOutline } from '@/components/icons/MdiTerminalNetworkOutline';
import { LineMdFileDocumentPlusFilled } from '@/components/icons/LineMdFileDocumentPlusFilled';

import { FileTreeContextMenuRenderer } from './FileTreeContextMenuRenderer';

import {
  CreateFileOrFolderDialog,
  RenameDialog,
  OperationPathDialog,
} from '@/components/dialogs';
import { deleteFile as apiDeleteFile } from '@/api/file';
import * as path from 'path-browserify';
import {
  isTerminalVisible,
  setShowTerminal,
  connectTerminal,
} from '@/stores/terminalStore';

import FileTreeHeader from './common/FileTreeHeader';
import FileTreeStatus from './common/FileTreeStatus';
import FileTreeList from './common/FileTreeList';

interface FileTreeProps {
  //projectRoot?: string;
}

const FileTree: React.FC<FileTreeProps> = () => {
  const {
    files: treeFiles,
    isFetchingTree,
    fetchTreeError,
  } = useStore(fileTreeStore);
  const { scanPathsInput } = useStore(llmStore);
  const projectRoot = useStore(projectRootDirectoryStore);
  const { currentProject } = useStore(projectStore); // Retrieve current project
  const projectId = currentProject?.id; // Get projectId

  const showTerminal = useStore(isTerminalVisible);
  const theme = useTheme();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [pathForNewItem, setPathForNewItem] = useState('');

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<FileEntry | null>(null);

  const [isOperationPathDialogOpen, setIsOperationPathDialogOpen] = 
    useState(false);
  const [itemForOperation, setItemForOperation] = useState<FileEntry | null>(
    null,
  );
  const [operationMode, setOperationMode] = useState<'copy' | 'move'>('copy');
  const [terminalDialogOpen, setTerminalDialogOpen] = useState(false);

  // State for search
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTreeFiles, setFilteredTreeFiles] = useState<FileEntry[]>([]);

  // Recursive filtering function for the file tree
  const filterTree = useCallback(
    (nodes: FileEntry[], term: string): FileEntry[] => {
      if (!term) return nodes; // If no search term, return all nodes

      const lowerCaseTerm = term.toLowerCase();
      const results: FileEntry[] = [];

      for (const node of nodes) {
        const nameMatches = node.name.toLowerCase().includes(lowerCaseTerm);
        let childrenMatches: FileEntry[] = [];

        if (node.type === 'folder' && node.children) {
          childrenMatches = filterTree(node.children, term);
        }

        if (nameMatches || childrenMatches.length > 0) {
          results.push({
            ...node,
            collapsed: false, // Ensure path to match is expanded
            children: childrenMatches, // Only include filtered children
          });
        }
      }
      return results;
    },
    [],
  );

  useEffect(() => {
    if (projectRoot && projectId) {
      loadInitialTree(projectRoot); // projectId is now handled internally by loadInitialTree from projectStore
    } else if (projectRoot && !projectId) {
      showGlobalSnackbar('No project selected. Cannot load file tree.', 'error');
      clearFileTree(); // Clear existing tree if no project is selected
    }
    return () => {
      clearFileTree();
    };
  }, [projectRoot, projectId]); // Add projectId to dependency array

  // Effect to apply search filter whenever treeFiles or searchTerm changes
  useEffect(() => {
    setFilteredTreeFiles(filterTree(treeFiles, searchTerm));
  }, [treeFiles, searchTerm, filterTree]);

  const refreshPath = useCallback(
    async (targetPath: string) => {
      if (!projectId) {
        console.error('Project ID is required to refresh path.');
        showGlobalSnackbar('No project selected. Cannot refresh file tree.', 'error');
        return;
      }

      const parentDir = path.dirname(targetPath);
      const isRoot = parentDir === targetPath; // This means targetPath is the root itself or a root-level item
      const pathToRefresh = 
        isRoot && parentDir === '/' ? targetPath : parentDir;

      if (pathToRefresh && pathToRefresh !== '.') {
        const state = fileTreeStore.get();
        const nodeToRefresh = findFileEntryInTree(state.files, pathToRefresh); // Ensure this helper exists or is imported

        if (nodeToRefresh && nodeToRefresh.type === 'folder' && state.expandedDirs.has(pathToRefresh)) {
          await loadChildrenForDirectory(pathToRefresh);
        } else if (projectRoot) {
          await loadInitialTree(projectRoot);
        }
      }
    }, // Removed explicit projectRoot dependency here as it's passed as an arg now if applicable
    [projectId], // Add projectId to dependency array
  );

  const handleRefreshTree = () => {
    if (projectRoot && projectId) {
      loadInitialTree(projectRoot);
      showGlobalSnackbar('File tree refreshed.', 'info');
    } else {
      showGlobalSnackbar('No project selected to refresh file tree.', 'warning');
    }
  };

  // Handler for adding new file/folder, called by FileTreeHeader or context menu
  const handleAddFileFolder = useCallback(
    (type: 'file' | 'folder', targetPath: string) => {
      setPathForNewItem(targetPath);
      setIsCreatingFolder(type === 'folder');
      setIsCreateDialogOpen(true);
    },
    [],
  );

  const handleCreateSuccess = useCallback(
    (newPath: string) => {
      const parentDir = path.dirname(newPath);
      refreshPath(parentDir); // refreshPath now uses projectId internally
      showGlobalSnackbar(
        `${isCreatingFolder ? 'Folder' : 'File'} created successfully at ${newPath}`,
        'success',
      );
    },
    [isCreatingFolder, refreshPath],
  );

  const handleDeleteItem = useCallback(
    async (node: FileEntry) => {
      if (!projectId) {
        showGlobalSnackbar('No project selected. Cannot delete file.', 'error');
        return;
      }
      if (
        window.confirm(
          `Are you sure you want to delete ${node.name}? This action cannot be undone.`,
        )
      ) {
        try {
          const result = await apiDeleteFile(node.path, projectId); // Pass projectId
          if (result.success) {
            showGlobalSnackbar(result.message, 'success');
            refreshPath(node.path);
          } else {
            showGlobalSnackbar(result.message || 'Failed to delete.', 'error');
          } 
        } catch (err: any) {
          showGlobalSnackbar(
            `Error deleting: ${err.message || String(err)}`,
            'error',
          );
        }
      }
    },
    [refreshPath, projectId], // Add projectId to dependency array
  );

  const handleRenameSuccess = useCallback(
    (oldPath: string, newPath: string) => {
      refreshPath(oldPath); // Refresh old parent to remove old name
      refreshPath(newPath); // Refresh new parent to add new name (could be same parent)
      showGlobalSnackbar('Item renamed successfully!', 'success');
    },
    [refreshPath],
  );

  const handleOperationSuccess = useCallback(
    (sourcePath: string, destinationPath: string) => {
      if (operationMode === 'move') {
        refreshPath(sourcePath);
      }
      refreshPath(destinationPath); // Add to destination
      showGlobalSnackbar(
        `${operationMode === 'copy' ? 'Copied' : 'Moved'} successfully!`,
        'success',
      );
    },
    [operationMode, refreshPath],
  );

  const renderContextMenuItems = useCallback(
    (node: FileEntry): ContextMenuItem[] => {
      const isFile = node.type === 'file';
      const parentPath = path.dirname(node.path);

      const items: ContextMenuItem[] = [
        {
          label: isFile ? 'Open File' : 'Open Folder',
          icon: <OpenInNewIcon fontSize="small" />,
          action: (file) => {
            if (file.type === 'file') {
              setSelectedFile(file.path);
              showGlobalSnackbar(`Opening file: ${file.name}`, 'info');
            } else {
              // For folders, we might want to expand/collapse or navigate
              // For now, just a snackbar message
              showGlobalSnackbar(`Folder selected: ${file.name}`, 'info');
            }
          },
        },
        { type: 'divider' },
        {
          label: 'New File...',
          icon: <LineMdFileDocumentPlusFilled fontSize="1.4em" />,
          action: (file) => {
            const targetPath = file.type === 'folder' ? file.path : parentPath;
            handleAddFileFolder('file', targetPath);
          },
        },
        {
          label: 'New Folder...',
          icon: <MaterialIconThemeFolderUtils fontSize="1.2em" />,
          action: (file) => {
            const targetPath = file.type === 'folder' ? file.path : parentPath;
            handleAddFileFolder('folder', targetPath);
          },
        },
        { type: 'divider' },
        {
          label: 'Rename...',
          icon: <MdiRenameBox fontSize="1.2em" />,
          action: (file) => {
            setItemToRename(file);
            setIsRenameDialogOpen(true);
          },
        },
        {
          label: 'Copy...',
          icon: <FileCopyIcon fontSize="small" />,
          action: (file) => {
            setItemForOperation(file);
            setOperationMode('copy');
            setIsOperationPathDialogOpen(true);
          },
        },
        {
          label: 'Move...',
          icon: <DriveFileMoveIcon fontSize="small" />,
          action: (file) => {
            setItemForOperation(file);
            setOperationMode('move');
            setIsOperationPathDialogOpen(true);
          },
        },
        { type: 'divider' },
        {
          label: 'Copy Path',
          icon: <MaterialIconThemeFolderResource fontSize="1.2em" />,
          action: (file) => {
            navigator.clipboard.writeText(file.path);
            showGlobalSnackbar('Path copied to clipboard!', 'success');
          },
        },
        {
          label: 'Open Terminal Here',
          icon: <MdiTerminalNetworkOutline fontSize="1.4em" />,
          action: (file) => {
            if (file.type === 'folder') {
              projectRootDirectoryStore.set(file.path);
              setShowTerminal(true);
              connectTerminal();
            }
          },
          disabled: isFile, // Disable for files
        },
        {
          label: 'Send to AI Scan Path',
          icon: <MaterialIconThemeFolderPrompts fontSize="1.2em" />,
          action: (file) => {
            const currentScanPaths = scanPathsInput || '';
            if (!currentScanPaths.includes(file.path)) {
              const newScanPaths = currentScanPaths
                ? `${currentScanPaths},${file.path}`
                : file.path;
              llmStore.setKey('scanPathsInput', newScanPaths);
              showGlobalSnackbar(
                `Added ${file.name} to AI scan paths.`,
                'success',
              );
            } else {
              showGlobalSnackbar(
                `${file.name} is already in AI scan paths.`,
                'info',
              );
            }
          },
        },
        { type: 'divider' },
        {
          label: `Delete ${isFile ? 'File' : 'Folder'}...`,
          icon: <DeleteIcon fontSize="small" />,
          action: handleDeleteItem,
          className: '!text-red-500 hover:!bg-red-900/50', // Tailwind class for danger styling
        },
      ];

      return items;
    },
    [handleDeleteItem, scanPathsInput, handleAddFileFolder], // Add handleAddFileFolder dependency
  );

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: FileEntry) => {
      event.preventDefault();
      event.stopPropagation();

      showFileTreeContextMenu(
        true,
        event.clientX,
        event.clientY,
        renderContextMenuItems(node),
        node,
      );
    },
    [renderContextMenuItems],
  );

  // Function to handle search term changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Function to handle going up a directory
  const handleGoUpDirectory = () => {
    // Ensure projectRoot is not null before proceeding
    if (projectRoot) {
      const parentDir = path.dirname(projectRoot);
      // If parentDir is the same as projectRoot, we are at the root already.
      // Or if parentDir is '.' which means projectRoot is a top-level directory in the current working directory
      // For a file tree starting at a specific projectRoot, going up means setting the parent of that root as the new root.
      // Assuming '/' is the absolute root that should stop further 'up' navigation.
      if (parentDir && parentDir !== '.' && parentDir !== projectRoot) {
        projectRootDirectoryStore.set(parentDir);
        // loadInitialTree will be triggered by the useEffect observing projectRoot
      } else if (projectRoot !== '/') {
        // If at a top-level folder within '/' and try to go up, set root to '/'
        projectRootDirectoryStore.set('/');
      }
    }
  };

  // Helper function for finding a file entry in the tree, assumed to exist or provided by `fileTreeStore`
  const findFileEntryInTree = (
    nodes: FileEntry[],
    targetPath: string,
  ): FileEntry | undefined => {
    for (const node of nodes) {
      if (node.path === targetPath) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = findFileEntryInTree(node.children, targetPath);
        if (found) return found;
      }
    }
    return undefined;
  };

  return (
    <Box
      sx={{
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Sticky Header */}
      <FileTreeHeader
        projectRoot={projectRoot}
        isFetchingTree={isFetchingTree}
        searchTerm={searchTerm}
        onGoUpDirectory={handleGoUpDirectory}
        onRefreshTree={handleRefreshTree}
        onAddFileFolder={handleAddFileFolder} // Pass the new handler
        onSearchChange={handleSearchChange}
      />

      {/* File List or Status Messages */}
      <FileTreeStatus
        isFetchingTree={isFetchingTree}
        fetchTreeError={fetchTreeError}
        treeFilesCount={treeFiles.length} // Original count
        filteredFilesCount={filteredTreeFiles.length} // New count for search
        projectRoot={projectRoot}
        searchTerm={searchTerm} // Pass search term
      />

      {!isFetchingTree && !fetchTreeError && filteredTreeFiles.length > 0 && (
        <FileTreeList
          treeFiles={filteredTreeFiles} // Pass filtered files
          projectRoot={projectRoot}
          onNodeContextMenu={handleNodeContextMenu}
        />
      )}

      <FileTreeContextMenuRenderer />

      <CreateFileOrFolderDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        parentPath={pathForNewItem}
        isFolder={isCreatingFolder}
        onCreateSuccess={handleCreateSuccess}
        projectId={projectId} // Pass projectId
      />

      <RenameDialog
        open={isRenameDialogOpen}
        onClose={() => setIsRenameDialogOpen(false)}
        item={itemToRename}
        onRenameSuccess={handleRenameSuccess}
        snackbar={{ show: showGlobalSnackbar }}
        projectId={projectId} // Pass projectId
      />

      <OperationPathDialog
        open={isOperationPathDialogOpen}
        onClose={() => setIsOperationPathDialogOpen(false)}
        item={itemForOperation}
        mode={operationMode}
        onOperationSuccess={handleOperationSuccess}
        snackbar={{ show: showGlobalSnackbar }}
        projectRoot={projectRoot}
        projectId={projectId} // Pass projectId
      />
    </Box>
  );
};

export default FileTree;
