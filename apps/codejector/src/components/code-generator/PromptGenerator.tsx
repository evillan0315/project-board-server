import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  Alert
} from '@mui/material';
import {
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { setError, errorStore } from '@/stores/errorStore';
import { aiEditorStore, showGlobalSnackbar } from '@/stores/aiEditorStore';
import {
  llmStore,
  setInstruction,
  setAiInstruction,
  setExpectedOutputInstruction,
  setLastLlmGeneratePayload,
  setScanPathsInput,
  setLastLlmResponse,
  setCurrentDiff,
  setIsBuilding,
  setLoading,
  setLlmError,
  setLlmResponse,
  clearLlmStore
} from '@/stores/llmStore';
import { authStore } from '@/stores/authStore';
import {
  fileTreeStore,
  loadInitialTree,
  projectRootDirectoryStore,
  setCurrentProjectPath,
} from '@/stores/fileTreeStore';
import { addLog } from '@/stores/logStore';
import {
  INSTRUCTION,
  ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
} from '@/constants/instruction';
import { generateCode, applyProposedChanges } from '@/api/llm';
import PromptGeneratorSettings from '@/components/Drawer/PromptGeneratorSettings';
import { LlmOutputFormat, LlmGeneratePayload, ModelResponse } from '@/types';
import { CodeGeneratorData } from './CodeGeneratorMain';
import CustomDrawer from '@/components/Drawer/CustomDrawer';
import BottomToolbar from './BottomToolbar';
import { debounce } from '@/utils/debounce';

interface PromptGeneratorProps {}

const PromptGenerator: React.FC<PromptGeneratorProps> = () => {
  const theme = useTheme();

  const currentProjectPath = useStore(projectRootDirectoryStore);
  const { loading, isBuilding, lastLlmResponse } = useStore(llmStore);
  const { isLoggedIn } = useStore(authStore);
  const { flatFileList } = useStore(fileTreeStore);
  const { message } = useStore(errorStore);

  const { uploadedFileData, uploadedFileMimeType } = useStore(llmStore);
  const { 
    instruction, // This comes from the global store
    aiInstruction,
    expectedOutputInstruction,
    requestType,
    llmOutputFormat,
    scanPathsInput,
  } = useStore(llmStore);

  // ---- local state for input to improve typing performance ----
  const [localInstruction, setLocalInstruction] = useState(instruction);

  // Synchronize localInstruction with global instruction when global state changes from other sources
  useEffect(() => {
    setLocalInstruction(instruction);
  }, [instruction]);

  // Debounced function to update the global instruction store
  const debouncedSetInstruction = useMemo(
    () =>
      debounce((value: string) => {
        setInstruction(value); // This updates the nanostore
      }, 300), // 300ms debounce delay
    [],
  );

  useEffect(() => {
    // Cleanup the debounced function on component unmount
    return () => {
      debouncedSetInstruction.cancel();
    };
  }, [debouncedSetInstruction]);

  // ---- other local states ----
  const [projectInput, setProjectInput] = useState(
    currentProjectPath || import.meta.env.VITE_BASE_DIR || '',
  );
  const [isPickerDialogOpen, setIsPickerDialogOpen] = useState(false); // Unused
  const [isProjectRootPickerDialogOpen, setIsProjectRootPickerDialogOpen] = useState(false);
  const [isScanPathsDialogOpen, setIsScanPathsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const commonDisabled = !isLoggedIn || loading || isBuilding;

  // ---- memoized values ----
  const currentScanPathsArray = useMemo(
    () =>
      scanPathsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [scanPathsInput],
  );

  const scanPathAutocompleteOptions = useMemo(() => {
    const options = flatFileList.map((e) => e.filePath).filter(Boolean);
    return Array.from(
      new Set([
        ...options,
        'src',
        'public',
        'package.json',
        'README.md',
        '.env',
      ]),
    ).sort();
  }, [flatFileList]);

  // ---- effects ----
  useEffect(() => {
    // keep local project input in sync with store
    if (currentProjectPath && projectInput !== currentProjectPath) {
      setProjectInput(currentProjectPath);
    } else if (!currentProjectPath && import.meta.env.VITE_BASE_DIR) {
      const base = import.meta.env.VITE_BASE_DIR;
      setProjectInput(base);
      loadInitialTree(base);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProjectPath]);

  useEffect(() => {
    const defaultAI = INSTRUCTION;
    const defaultExpected = ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT;
    if (llmOutputFormat === LlmOutputFormat.JSON) {
      if (aiInstruction !== defaultAI) setAiInstruction(defaultAI);
      if (expectedOutputInstruction !== defaultExpected)
        setExpectedOutputInstruction(defaultExpected);
    }
  }, [llmOutputFormat, aiInstruction, expectedOutputInstruction]);

  // ---- handlers ----
  const updateScanPaths = useCallback(
    (paths: string[]) =>
      setScanPathsInput([...new Set(paths)].sort().join(', ')),
    [],
  );

  const handleLoadProject = useCallback(() => {
    if (!projectInput) return setError('Please provide a project root path.');
    setCurrentProjectPath(projectInput);
    setError('');
    setLastLlmResponse(null);
    setCurrentDiff(null, null);
    setIsBuilding(false);
    loadInitialTree(projectInput);
    addLog('Prompt Generator', `Project loaded: ${projectInput}`, 'success');
  }, [projectInput]);

  const handleGenerateCode = useCallback(async () => {
    if (!instruction) {
      showGlobalSnackbar('Please provide instructions for the AI.', 'error');
      return;
    }
    if (!isLoggedIn) {
      showGlobalSnackbar('You must be logged in to use the AI Editor', 'error');
      return;
    }
    if (!currentProjectPath) {
      showGlobalSnackbar('Please load a project first.', 'error');
      return;
    }

    setLoading(true);
    setError('');
    setLastLlmResponse(null);
    setCurrentDiff(null, null);
    setIsBuilding(false);

    try {
      const payload: LlmGeneratePayload = {
        userPrompt: instruction,
        projectRoot: currentProjectPath,
        projectStructure: '',
        relevantFiles: [],
        additionalInstructions: aiInstruction,
        expectedOutputFormat: expectedOutputInstruction,
        scanPaths: currentScanPathsArray,
        requestType,
        output: 'json',
        ...(uploadedFileData && { fileData: uploadedFileData }),
        ...(uploadedFileMimeType && { fileMimeType: uploadedFileMimeType }),
      };

      setLastLlmGeneratePayload(payload);

      const aiResponse: ModelResponse = await generateCode(payload);
   

      // Normalize errors to strings
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
      }

      // If rawResponse is available, set it in the editor safely
      if (aiResponse.rawResponse) {
        setLlmResponse(aiResponse.rawResponse);
      }

      // Only update store if there’s no error to avoid rendering [object Error]
      if (!errorMessage) {
        setLastLlmResponse(aiResponse);
        // Auto-apply changes if enabled
        if (
          aiEditorStore.get().autoApplyChanges &&
          aiResponse.changes?.length
        ) {
          try {
            await applyProposedChanges(aiResponse.changes, currentProjectPath);
            addLog(
              'Prompt Generator',
              'Proposed changes auto-applied.',
              'success',
            );
          } catch (err) {
            const applyErr =
              err instanceof Error
                ? err.message
                : typeof err === 'string'
                  ? err
                  : JSON.stringify(err);
            setError(applyErr);
            addLog('Prompt Generator', applyErr, 'error');
          }
        }
      } else {
        setError(errorMessage);
        addLog('Prompt Generator', errorMessage, 'error');
        showGlobalSnackbar(errorMessage, 'error');
      }
    } catch (err) {
      const msg = `Failed to generate code: ${err instanceof Error ? err.message : String(err)}`;
      setError(msg);
      addLog('Prompt Generator', msg, 'error');
      showGlobalSnackbar(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [
    instruction,
    isLoggedIn,
    currentProjectPath,
    aiInstruction,
    expectedOutputInstruction,
    currentScanPathsArray,
    requestType,
    uploadedFileData,
    uploadedFileMimeType,
  ]);

  const handleSave = useCallback(() => {
    // Settings are saved directly by PromptGeneratorSettings, just close the drawer
    setIsSettingsOpen(false);
    addLog('Prompt Generator', 'Prompt Generator settings saved.', 'info');
  }, []);

  // ---- render ----
  return (
    <Box className="flex flex-col gap-2 w-full relative ">
     
      <Box
        position="relative"
        className="mt-2 px-2 pr-12 overflow-auto max-h-[80px] items-end h-full"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleGenerateCode();
          }
        }}
      >
        <Box className="mb-0">
          <TextField
            multiline
            fullWidth
            placeholder="Type your instruction..."
            value={localInstruction}
            onChange={(e) => {
              setLocalInstruction(e.target.value); // Update local state immediately
              debouncedSetInstruction(e.target.value); // Debounce update to global store
            }}
            variant="standard"
            InputProps={{ disableUnderline: true }}
            className="mb-2 border-0"
            sx={{
              p: 0,
              '& .css-1asjr57-MuiFormControl-root-MuiTextField-root': {
                backgroundColor: `${theme.palette.background.default}  !important`,
              },
            }}
          />
        </Box>
      </Box>
      <Box
        className="absolute top-2 right-0 flex items-center"
        sx={{ paddingRight: theme.spacing(1) }}
      >
        <Tooltip title="Generate/Modify Code">
          <IconButton
            color="success"
            onClick={handleGenerateCode}
            disabled={commonDisabled || loading || !instruction}
          >
            {loading ? <CircularProgress size={16} /> : <SendIcon />}
          </IconButton>
        </Tooltip>
        
      </Box>
      
        <Box className="mt-2 flex items-center">
        {message && (
        <>
          <Typography variant="body2" color='error'>{message}</Typography>
          </>
        )}
        {loading && (
        <>
          <CircularProgress size={20} className="mr-1" />
          <Typography variant="body2" color='info'>Generating...</Typography>
          </>
        )}
        </Box>
      
      <BottomToolbar
        scanPathAutocompleteOptions={scanPathAutocompleteOptions}
        currentScanPathsArray={currentScanPathsArray}
        projectInput={projectInput}
        setProjectInput={setProjectInput}
        handleLoadProject={handleLoadProject}
        isImportDialogOpen={isImportDialogOpen}
        setIsImportDialogOpen={setIsImportDialogOpen}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        isProjectRootPickerDialogOpen={isProjectRootPickerDialogOpen}
        setIsProjectRootPickerDialogOpen={setIsProjectRootPickerDialogOpen}
        isScanPathsDialogOpen={isScanPathsDialogOpen}
        setIsScanPathsDialogOpen={setIsScanPathsDialogOpen}
        updateScanPaths={updateScanPaths}
        requestType={requestType}
        handleSave={handleSave}
        commonDisabled={commonDisabled}
      />
    </Box>
  );
};

export default PromptGenerator;
