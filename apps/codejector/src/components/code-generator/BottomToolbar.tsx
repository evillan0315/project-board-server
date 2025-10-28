import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  Box,
  Tooltip,
  IconButton,
  FormControlLabel,
  Switch,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  DriveFolderUpload as DriveFolderUploadIcon,
  FolderOpen as FolderOpenIcon,
  AddRoad as AddRoadIcon,
  CloudUpload as CloudUploadIcon,
  Settings as SettingsIcon,
  Clear as ClearIcon,
  Save as SaveIcon,
  BugReport as BugReportIcon,
  Check as CheckIcon,
  Build as RepairIcon,
  AutoAwesomeOutlined as AutoAwesomeOutlinedIcon,
  DataObjectOutlined as DataObjectOutlinedIcon,
} from '@mui/icons-material';
import {
  setLastLlmResponse,
  setCurrentDiff,
  setIsBuilding,
  llmStore,
  setLlmResponse,
  clearLlmStore,
  setLoading,
  setLlmError,
  setLastLlmGeneratePayload,
} from '@/stores/llmStore';
import {
  loadInitialTree,
  projectRootDirectoryStore,
  setCurrentProjectPath,
  fileTreeStore,
} from '@/stores/fileTreeStore';
import { addLog } from '@/stores/logStore';
import { setError } from '@/stores/errorStore';
import {
  autoApplyChanges,
  setAutoApplyChanges,
  showGlobalSnackbar,
} from '@/stores/aiEditorStore';
import { useStore } from '@nanostores/react';
import CustomDrawer from '@/components/Drawer/CustomDrawer';
import { CodeRepair } from '@/components/code-generator/utils/CodeRepair';
import { ImportJson } from './drawerContent/ImportJson';
import { CodeGeneratorData } from './CodeGeneratorMain';
import {
  RequestType,
  ModelResponse,
  LlmGeneratePayload,
  LlmOutputFormat,
} from '@/types/llm';
import { generateCode, extractCodeFromMarkdown } from '@/api/llm';

import * as path from 'path-browserify';

// New import for the refactored ScanPathsDrawer
import ScanPathsDrawer from '@/components/code-generator/drawerContent/ScanPathsDrawer';
// New import for the refactored DirectoryPickerDrawer
import DirectoryPickerDrawer from '@/components/code-generator/drawerContent/DirectoryPickerDrawer';
// New import for the relocated PromptGeneratorSettings
import PromptGeneratorSettings from '@/components/code-generator/drawerContent/PromptGeneratorSettings';

interface BottomToolbarProps {
  scanPathAutocompleteOptions: string[];
  currentScanPathsArray: string[]; // Current paths from llmStore
  projectInput: string;
  setProjectInput: (value: string) => void;
  handleLoadProject: () => void;

  isImportDialogOpen: boolean;
  setIsImportDialogOpen: (open: boolean) => void;
  isProjectRootPickerDialogOpen: boolean;
  setIsProjectRootPickerDialogOpen: (open: boolean) => void;
  isScanPathsDialogOpen: boolean;
  setIsScanPathsDialogOpen: (open: boolean) => void;

  updateScanPaths: (paths: string[]) => void; // Function to update the llmStore.scanPathsInput
  requestType: RequestType;
  handleSave: () => void;
  commonDisabled?: boolean;
}

const BottomToolbar: React.FC<BottomToolbarProps> = ({
  scanPathAutocompleteOptions,
  currentScanPathsArray,
  projectInput,
  setProjectInput,
  handleLoadProject,

  isImportDialogOpen,
  setIsImportDialogOpen,
  isProjectRootPickerDialogOpen,
  setIsProjectRootPickerDialogOpen,
  isScanPathsDialogOpen,
  setIsScanPathsDialogOpen,

  updateScanPaths, // This now updates the llmStore
  requestType,
  handleSave,
  commonDisabled,
}) => {
  const theme = useTheme();
  const $autoApplyChanges = useStore(autoApplyChanges);
  const [importContentString, setImportContentString] = useState<string>('');
  const [isCodeRepairOpen, setIsCodeRepairOpen] = useState(false);
  const { response, aiInstruction, expectedOutputInstruction, scanPathsInput, loading } = useStore(llmStore);
  const { flatFileList } = useStore(fileTreeStore);
  const currentProjectPath = useStore(projectRootDirectoryStore);

  // New local state to hold changes made within the ScanPathsDrawer before confirming
  const [localScanPaths, setLocalScanPaths] = useState<string[]>(currentScanPathsArray);

  // New state for the PromptGeneratorSettingsDrawer
  const [isPromptGeneratorSettingsDrawerOpen, setIsPromptGeneratorSettingsDrawerOpen] = useState(false);

  // New state to hold the currently browsed path in DirectoryPickerDrawer
  const [selectedDirectoryPathForDrawer, setSelectedDirectoryPathForDrawer] = useState<string>(projectInput || '/');

  // Sync localScanPaths with currentScanPathsArray when the drawer is opened or parent changes it
  useEffect(() => {
    if (isScanPathsDialogOpen) {
      setLocalScanPaths(currentScanPathsArray);
    } else {
      // Reset local state when drawer closes to reflect true store state if parent updated it
      setLocalScanPaths(currentScanPathsArray);
    }
  }, [isScanPathsDialogOpen, currentScanPathsArray]);

  // Sync selectedDirectoryPathForDrawer with projectInput if projectInput changes externally
  useEffect(() => {
    setSelectedDirectoryPathForDrawer(projectInput || '/');
  }, [projectInput]);

  const toggleCodeRepair = useCallback(() => {
    setIsCodeRepairOpen((open) => !open);
  }, []);

  const handleImport = useCallback(() => {
    try {
      const parsedData: unknown = JSON.parse(importContentString);

      // Attempt to treat it as a full ModelResponse (CodeGeneratorData)
      // Check for key properties of CodeGeneratorData
      if (
        typeof parsedData === 'object' &&
        parsedData !== null &&
        'title' in parsedData && typeof (parsedData as CodeGeneratorData).title === 'string' &&
        'summary' in parsedData && typeof (parsedData as CodeGeneratorData).summary === 'string' &&
        'changes' in parsedData && Array.isArray((parsedData as CodeGeneratorData).changes)
      ) {
        setLastLlmResponse(parsedData as CodeGeneratorData);
        // If it also contains rawResponse, use that for the editor
        if ('rawResponse' in parsedData && typeof (parsedData as { rawResponse: string }).rawResponse === 'string') {
          setLlmResponse((parsedData as { rawResponse: string }).rawResponse);
        } else {
          // If it's a structured response but no rawResponse, use the stringified version
          setLlmResponse(JSON.stringify(parsedData, null, 2));
        }
      } else {
        // If it's not a full ModelResponse, treat it as raw JSON content for the editor
        setLlmResponse(JSON.stringify(parsedData, null, 2));
        setLastLlmResponse(null); // Clear previous structured response if this is raw content
      }
      showGlobalSnackbar('Data imported successfully!', 'success');
      setIsImportDialogOpen(false);
    } catch (err) {
      console.error(err, 'err');
      setLastLlmResponse(null);
      const msg = `Invalid JSON: ${err instanceof Error ? err.message : String(err)}`;
      showGlobalSnackbar(msg, 'error');
    }
  }, [importContentString, setIsImportDialogOpen]);

  // Helper to get relevant files for payload
  const getRelevantFiles = useCallback(() => {
    const projectRoot = currentProjectPath;
    if (!projectRoot) return [];

    const scannedPaths = scanPathsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    // Filter flatFileList based on scanPaths
    return flatFileList
      .filter((file) => {
        if (!file.filePath) return false;
        // Check if the file path is within any of the scanned directories
        // Use path.join to ensure platform consistency
        return scannedPaths.some(
          (scanPath) =>
            file.filePath.startsWith(path.join(projectRoot, scanPath)) ||
            file.filePath === path.join(projectRoot, scanPath),
        );
      })
      .map((file) => ({
        filePath: file.filePath,
        relativePath: path.relative(projectRoot, file.filePath),
        content: '', // Content will be fetched on backend
      }));
  }, [currentProjectPath, scanPathsInput, flatFileList]);

  const handleRepair = useCallback(async () => {
    if (!response) {
      showGlobalSnackbar('No content in Code Repair editor to process.', 'error');
      return;
    }
    if (!currentProjectPath) {
      showGlobalSnackbar('Project root is not set. Please load a project first.', 'error');
      return;
    }
    setIsCodeRepairOpen(false)
    setLoading(true);
    setError(''); // Clear UI error
    setLlmError(null); // Clear LLM specific error
    setLastLlmResponse(null); // Clear previous AI response
    setCurrentDiff(null, null); // Clear current diff display
    setIsBuilding(false); // Ensure build state is reset

    try {
      const payload: LlmGeneratePayload = {
        userPrompt: response, // The content currently in the CodeRepair editor
        projectRoot: currentProjectPath,
        projectStructure: '', // This might be dynamically generated on the backend or in PromptGenerator. We'll leave it empty here.
        relevantFiles: getRelevantFiles(), // Fetch relevant files based on scan paths
        additionalInstructions: aiInstruction,
        expectedOutputFormat: expectedOutputInstruction,
        scanPaths: currentScanPathsArray,
        requestType: RequestType.CODE_REPAIR, // Set request type to CODE_REPAIR
        output: LlmOutputFormat.JSON, // Always expect JSON for structured responses
      };

      setLastLlmGeneratePayload(payload);
      addLog('Code Repair', 'Sending CODE_REPAIR request to AI...', 'info');

      const aiResponse: ModelResponse = await generateCode(payload);

      let errorMessage: string | null = null;
      if (aiResponse.error) {
        errorMessage =
          aiResponse.error instanceof Error
            ? aiResponse.error.message
            : typeof aiResponse.error === 'string'
              ? aiResponse.error
              : JSON.stringify(aiResponse.error);
        setError(errorMessage);
        setLlmError(errorMessage);
        showGlobalSnackbar(`AI Error: ${errorMessage}`, 'error');
      }

      if (aiResponse.rawResponse) {
        setLlmResponse(aiResponse.rawResponse); // Update the CodeRepair editor with the new raw response
      }

      if (!errorMessage) {
        setLastLlmResponse(aiResponse); // Set the structured response for ChangesList
        showGlobalSnackbar('Code Repair response received. Review changes.', 'success');
        setIsCodeRepairOpen(false); // Close the drawer on successful repair generation
      }
    } catch (err) {
      const msg = `Failed to perform code repair: ${err instanceof Error ? err.message : String(err)}`;
      setError(msg);
      addLog('Code Repair', msg, 'error');
      showGlobalSnackbar(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [
    response,
    currentProjectPath,
    aiInstruction,
    expectedOutputInstruction,
    currentScanPathsArray,
    flatFileList,
    scanPathsInput,
    getRelevantFiles,
  ]);

  // GlobalAction for PromptGeneratorSettingsDrawer footer
  const PromptGeneratorSettingsDrawerActions: GlobalAction[] = [
    {
      label: 'Close',
      action: () => setIsPromptGeneratorSettingsDrawerOpen(false),
      icon: <ClearIcon />,
      color: 'text',
      variant: 'outlined'
    },
  ];

  const ImportDataActions = useMemo<GlobalAction[]>(() => [
    {
      label: 'Cancel',
      action: () => setIsImportDialogOpen(false),
      icon: <ClearIcon />,
      color: 'text',
      variant: 'outlined'
    },
    {
      label: 'Import',
      action: handleImport,
      icon: <CloudUploadIcon />,
      color: 'primary',
      variant: 'contained',
      disabled: !importContentString, // Disable if no content to import
    },
  ], [handleImport, importContentString, setIsImportDialogOpen]);

  // Action buttons for the ScanPathsDrawer
  const ScanPathsDrawerActions: GlobalAction[] = [
    {
    label: 'Cancel',
    color: 'text',
    variant: 'outlined',
    action: () => setIsScanPathsDialogOpen(false),
    icon: <ClearIcon />
    },
    {
      label: 'Confirm',
      color: 'primary',
      variant: 'contained',
      action: () => {
        updateScanPaths(localScanPaths); // Commit changes from local state to store
        setIsScanPathsDialogOpen(false);
        showGlobalSnackbar('Scan paths updated successfully!', 'success');
      },
      icon: <CheckIcon />,
      disabled: false,
    },
  ];

  // Action buttons for the DirectoryPickerDrawer
  const DirectoryPickerDrawerActions: GlobalAction[] = [
    {
      label: 'Cancel',
      color: 'text',
      variant: 'outlined',
      action: () => setIsProjectRootPickerDialogOpen(false),
      icon: <ClearIcon />
    },
    {
      label: 'Select',
      color: 'primary',
      variant: 'contained',
      action: () => {
        // 1. Update the parent component's local state (PromptGenerator's projectInput)
        // so the TextField reflects the newly selected path when the drawer closes.
        setProjectInput(selectedDirectoryPathForDrawer);

        // 2. Directly update the global project root store.
        setCurrentProjectPath(selectedDirectoryPathForDrawer);

        // 3. Trigger the file tree loading for the newly selected project root.
        // This ensures the tree updates immediately with the correct path selected in the drawer,
        // bypassing any stale `handleLoadProject` closures.
        loadInitialTree(selectedDirectoryPathForDrawer);

        // 4. Log the action.
        addLog('Directory Picker', `Project root selected: ${selectedDirectoryPathForDrawer}`, 'success');

        // 5. Close the drawer.
        setIsProjectRootPickerDialogOpen(false);
      },
      icon: <CheckIcon />,
      disabled: !selectedDirectoryPathForDrawer, // Disable if no path is selected
    },
  ];

  // Action buttons for the CodeRepair drawer, including an "Import Data" button
  const CodeRepairActions: GlobalAction[] = [
    { label: 'Cancel', action: toggleCodeRepair, icon: <ClearIcon />, color: 'text', variant: 'outlined' },
    {
      label: 'Import Data',
      action: () => {
        // Attempt to parse the current content of the CodeRepair editor (which is `response` from llmStore)
        // and set it as lastLlmResponse, as if it were a new AI response.
        try {
          if (!response) {
            showGlobalSnackbar('No content in Code Repair editor to import.', 'warning');
            return;
          }
          
          const parsedData: unknown = JSON.parse(extractCodeFromMarkdown(response));
          if (
            typeof parsedData === 'object' &&
            parsedData !== null &&
            'title' in parsedData && typeof (parsedData as CodeGeneratorData).title === 'string' &&
            'summary' in parsedData && typeof (parsedData as CodeGeneratorData).summary === 'string' &&
            'changes' in parsedData && Array.isArray((parsedData as CodeGeneratorData).changes)
          ) {
            setLastLlmResponse(parsedData as CodeGeneratorData);
            showGlobalSnackbar('Content imported as structured LLM response.', 'success');
            setIsCodeRepairOpen(false)
          } else {
            setLastLlmResponse(null); // Clear existing structured response if new content is not valid
            showGlobalSnackbar('Content is not a valid structured LLM response. Clearing structured data.', 'warning');
          }
        } catch (err) {
          console.error('Failed to parse Code Repair content for import:', err);
          setLastLlmResponse(null); // Ensure previous structured response is cleared on error
          showGlobalSnackbar(`Failed to parse content as valid JSON: ${err instanceof Error ? err.message : String(err)}`, 'error');
        }
      },
      icon: <DataObjectOutlinedIcon />,
      color: 'secondary',
      variant: 'outlined',
      disabled: !response, // Disable if no content in CodeRepair editor
    },
    {
      label: 'Repair',
      action: handleRepair, // Call the new handleRepair function
      icon: loading ? <CircularProgress size={16} /> : <RepairIcon />,
      color: 'primary',
      variant: 'contained',
      disabled: commonDisabled || loading || !response, // Disable if no content or already loading
    },
  ];

  return (
    <Box className="flex items-center justify-between gap-2 ">
      <Box className="flex flex-wrap gap-2 ">
        <Tooltip title="Prompt generator settings" aria-label="Prompt generator settings">
          <IconButton
            color="primary"
            onClick={() => setIsPromptGeneratorSettingsDrawerOpen(true)} // Open the new drawer
            aria-label="open prompt generator settings"
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Load the selected project" aria-label="Load the selected project">
          <IconButton
            color="primary"
            disabled={commonDisabled}
            onClick={handleLoadProject}
            aria-label="load selected project"
          >
            <DriveFolderUploadIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Pick project root directory" aria-label="Pick project root directory">
          <IconButton
            color="primary"
            onClick={() => setIsProjectRootPickerDialogOpen(true)}
            aria-label="pick project root directory"
          >
            <FolderOpenIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Manage scan paths for the AI search" aria-label="Manage scan paths for the AI search">
          <IconButton
            color="primary"
            onClick={() => setIsScanPathsDialogOpen(true)}
            aria-label="manage scan paths"
          >
            <AddRoadIcon />
          </IconButton>
        </Tooltip>

        {requestType === RequestType.LLM_GENERATION && (
          <Tooltip
            title="Import prompt data from JSON file"
            aria-label="Import prompt data from JSON file"
          >
            <IconButton
              color="primary"
              onClick={() => setIsImportDialogOpen(true)}
              aria-label="import json data"
            >
              <CloudUploadIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {requestType === RequestType.LLM_GENERATION && (
        <Box className="flex flex-wrap gap-0 ">
          <Tooltip title="Toggle Code Repair Drawer" aria-label="Toggle Code Repair Drawer">
            <IconButton
              color="primary"
              onClick={toggleCodeRepair}
              disabled={commonDisabled || !response}
              aria-label="toggle code repair drawer"
            >
              <BugReportIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear editor and AI response" aria-label="Clear editor and AI response">
            <IconButton
              color="error"
              onClick={clearLlmStore}
              disabled={commonDisabled}
              aria-label="clear editor and ai response"
            >
              <ClearIcon />
            </IconButton>
          </Tooltip>

          <FormControlLabel
            control={
              <Switch
                className="ml-2"
                checked={$autoApplyChanges}
                onChange={(e) => setAutoApplyChanges(e.target.checked)}
                name="autoApply"
              />
            }
            label="Auto Apply"
          />
        </Box>
      )}
      {/* Dialogs */}
      {/* PromptGeneratorSettings now wrapped in CustomDrawer */}
      <CustomDrawer
        open={isPromptGeneratorSettingsDrawerOpen}
        onClose={() => setIsPromptGeneratorSettingsDrawerOpen(false)}
        position="left"
        size="medium"
        title="Prompt Generator Settings"
        hasBackdrop={true}
        footerActionButton={PromptGeneratorSettingsDrawerActions}
      >
        <PromptGeneratorSettings />
      </CustomDrawer>

      {/* ScanPathsDrawer now wrapped in CustomDrawer */}
      <CustomDrawer
        open={isScanPathsDialogOpen}
        onClose={() => setIsScanPathsDialogOpen(false)}
        position="right"
        size="normal"
        title="Manage Scan Paths"
        hasBackdrop={false}
        footerActionButton={ScanPathsDrawerActions}
      >
        <ScanPathsDrawer
          currentScanPaths={currentScanPathsArray}
          availablePaths={scanPathAutocompleteOptions}
          allowExternalPaths
          onLocalPathsChange={setLocalScanPaths}
        />
      </CustomDrawer>

      {/* DirectoryPickerDrawer now wrapped in CustomDrawer */}
      <CustomDrawer
        open={isProjectRootPickerDialogOpen}
        onClose={() => setIsProjectRootPickerDialogOpen(false)}
        position="right"
        size="normal"
        title="Select Project Root Folder"
        hasBackdrop={false}
        footerActionButton={DirectoryPickerDrawerActions}
      >
        <DirectoryPickerDrawer
          onSelect={(path) => {
            // This onSelect is now only for direct selection inside drawer if an internal button called it
            // but for external footer, we rely on onPathUpdate
            setCurrentProjectPath(path);
            handleLoadProject();
            setIsProjectRootPickerDialogOpen(false);
          }}
          onClose={() => setIsProjectRootPickerDialogOpen(false)}
          initialPath={projectInput || '/'} // Pass the projectInput so the drawer starts at the currently loaded project or default
          allowExternalPaths
          onPathUpdate={setSelectedDirectoryPathForDrawer} // Pass the new callback
        />
      </CustomDrawer>

      <CustomDrawer
        open={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        position="left"
        size="medium"
        title="Import Data"
        hasBackdrop={true}
        footerActionButton={ImportDataActions}
      >
        <ImportJson value={importContentString} onChange={setImportContentString} />
      </CustomDrawer>
      <CustomDrawer
        open={isCodeRepairOpen}
        onClose={() => setIsCodeRepairOpen(false)}
        position="left"
        size="medium"
        title="Code Repair"
        hasBackdrop={true}
        footerActionButton={CodeRepairActions}
      >
        <CodeRepair
          value={response || ''}
          onChange={setLlmResponse}
          filePath="temp.json"
          height="100%"
        />
      </CustomDrawer>
    </Box>
  );
};

export default BottomToolbar;
