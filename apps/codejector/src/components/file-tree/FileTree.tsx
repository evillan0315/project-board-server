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
  TextField,
} from '@mui/material';
import FileTreeItem from './FileTreeItem';
import {
  fileTreeStore,
  loadInitialTree,
  clearFileTree,
  loadChildrenForDirectory,
  setSelectedFile,
  projectRootDirectoryStore,
  setCurrentProjectPath,
} from '@/stores/fileTreeStore';
import { llmStore, showGlobalSnackbar } from '@/stores/llmStore';

import { ContextMenuItem } from '@/types/main';
import { FileEntry } from '@/types/refactored/fileTree';
import { showFileTreeContextMenu } from '@/stores/contextMenuStore';
import {
  ContentCopy as ContentCopyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  NoteAdd as NoteAddIcon,
  CreateNewFolder as CreateNewFolderIcon,
  Terminal as TerminalIcon,
  OpenInNew as OpenInNewIcon,
  Refresh as RefreshIcon,
  DriveFileMove as DriveFileMoveIcon,
  FileCopy as FileCopyIcon,
  ArrowUpward as ArrowUpwardIcon,
  Source as SourceFolderIcon,
 CreateNewFolder as MaterialIconThemeFolderResource
} from '@mui/icons-material';
import FolderOpenIcon from '@mui/icons-material/FolderOpenOutlined';
import { MaterialIconThemeFolderUtils } from '@/components/icons/MaterialIconThemeFolderUtils';
import { MaterialIconThemeFolderPrompts } from '@/components/icons/MaterialIconThemeFolderPrompts';
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
}

const FileTree: React.FC<FileTreeProps> = () => {
  const {
    files: treeFiles,
    isFetchingTree,
    fetchTreeError,
  } = useStore(fileTreeStore);
  const { scanPathsInput } = useStore(llmStore);
  const projectRoot = useStore(projectRootDirectoryStore);

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
            collapsed: false,
            children: childrenMatches,
          });
        }
      }
      return results;
    },
    [],
  );

  useEffect(() => {
    if (projectRoot) {
      loadInitialTree(projectRoot);
    } else {
      showGlobalSnackbar('No project root specified. Cannot load file tree.', 'error');
      clearFileTree();
    }
    return () => {
      clearFileTree();
    };
  }, [projectRoot]);

  // Effect to apply search filter whenever treeFiles or searchTerm changes
  useEffect(() => {
    setFilteredTreeFiles(filterTree(treeFiles, searchTerm));
  }, [treeFiles, searchTerm, filterTree]);

  const refreshPath = useCallback(
    async (targetPath: string) => {
      const parentDir = path.dirname(targetPath);
      const isRoot = parentDir === targetPath;
      const pathToRefresh = 
        isRoot && parentDir === '/' ? targetPath : parentDir;

      if (pathToRefresh && pathToRefresh !== '.') {
        const state = fileTreeStore.get();
        const nodeToRefresh = findFileEntryInTree(state.files, pathToRefresh);

        if (nodeToRefresh && nodeToRefresh.type === 'folder' && state.expandedDirs.has(pathToRefresh)) {
          await loadChildrenForDirectory(pathToRefresh);
        } else if (projectRoot) {
          await loadInitialTree(projectRoot);
        }
      }
    },
    [projectRoot],
  );

  const handleRefreshTree = () => {
    if (projectRoot) {
      loadInitialTree(projectRoot);
      showGlobalSnackbar('File tree refreshed.', 'info');
    } else {
      showGlobalSnackbar('No project root specified to refresh file tree.', 'warning');
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
      refreshPath(parentDir);
      showGlobalSnackbar(
        `${isCreatingFolder ? 'Folder' : 'File'} created successfully at ${newPath}`,
        'success',
      );
    },
    [isCreatingFolder, refreshPath],
  );

  const handleDeleteItem = useCallback(
    async (node: FileEntry) => {
      if (window.confirm(
          `Are you sure you want to delete ${node.name}? This action cannot be undone.`,
        )
      ) {
        try {
          const result = await apiDeleteFile(node.path);
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
    [refreshPath],
  );

  const handleRenameSuccess = useCallback(
    (oldPath: string, newPath: string) => {
      refreshPath(oldPath);
      refreshPath(newPath);
      showGlobalSnackbar('Item renamed successfully!', 'success');
    },
    [refreshPath],
  );

  const handleOperationSuccess = useCallback(
    (sourcePath: string, destinationPath: string) => {
      if (operationMode === 'move') {
        refreshPath(sourcePath);
      }
      refreshPath(destinationPath);
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
              showGlobalSnackbar(`Folder selected: ${file.name}`, 'info');
            }
          },
        },
        {
          label: 'Set as Project Root',
          icon: <SourceFolderIcon fontSize="small" />,
          action: (file) => {
            setCurrentProjectPath(file.path);
            showGlobalSnackbar(`Project root set to: ${file.path}`, 'success');
          },
          disabled: isFile,
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
          disabled: isFile,
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
          className: '!text-red-500 hover:!bg-red-900/50',
        },
      ];

      return items;
    },
    [handleDeleteItem, scanPathsInput, handleAddFileFolder],
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
    if (projectRoot) {
      const parentDir = path.dirname(projectRoot);
      if (parentDir && parentDir !== '.' && parentDir !== projectRoot) {
        projectRootDirectoryStore.set(parentDir);
      } else if (projectRoot !== '/') {
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
        onAddFileFolder={handleAddFileFolder}
        onSearchChange={handleSearchChange}
      />

      {/* File List or Status Messages */}
      <FileTreeStatus
        isFetchingTree={isFetchingTree}
        fetchTreeError={fetchTreeError}
        treeFilesCount={treeFiles.length}
        filteredFilesCount={filteredTreeFiles.length}
        projectRoot={projectRoot}
        searchTerm={searchTerm}
      />

      {!isFetchingTree && !fetchTreeError && filteredTreeFiles.length > 0 && (
        <FileTreeList
          treeFiles={filteredTreeFiles}
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
      />

      <RenameDialog
        open={isRenameDialogOpen}
        onClose={() => setIsRenameDialogOpen(false)}
        item={itemToRename}
        onRenameSuccess={handleRenameSuccess}
        snackbar={{ show: showGlobalSnackbar }}
      />

      <OperationPathDialog
        open={isOperationPathDialogOpen}
        onClose={() => setIsOperationPathDialogOpen(false)}
        item={itemForOperation}
        mode={operationMode}
        onOperationSuccess={handleOperationSuccess}
        snackbar={{ show: showGlobalSnackbar }}
        projectRoot={projectRoot}
      />
    </Box>
  );
};

export default FileTree;