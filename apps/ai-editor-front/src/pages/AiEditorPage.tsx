import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  aiEditorStore,
  setLoading,
  setError,
  setInstruction,
  setScanPathsInput,
  clearState,
  setLastLlmResponse,
  toggleSelectedChange,
  selectAllChanges,
  deselectAllChanges,
  setCurrentDiff,
  clearDiff,
  setApplyingChanges,
  setAppliedMessages,
} from '@/stores/aiEditorStore';
import { authStore } from '@/stores/authStore';
import {
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  useTheme,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { generateCode, applyProposedChanges, getGitDiff } from '@/api/llm';
import { LlmGeneratePayload, LlmResponse, ProposedFileChange, FileAction } from '@/types/llm';
import { INSTRUCTION, ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT } from '@/constants';

// Basic Diff Viewer Component (can be replaced with a more advanced library)
const DiffViewer: React.FC<{ diffContent: string; filePath: string }> = ({
  diffContent,
  filePath,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        mt: 2,
        p: 2,
        bgcolor: isDarkMode ? '#2d2d2d' : '#f0f0f0',
        borderRadius: 1,
        overflowX: 'auto',
        border: '1px solid ' + (isDarkMode ? '#444' : '#ccc'),
      }}
    >
      <Typography variant="subtitle2" gutterBottom sx={{ fontFamily: 'monospace' }}>
        Diff for: {filePath}
      </Typography>
      <pre
        style={{
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          color: isDarkMode ? '#e0e0e0' : '#333',
        }}
      >
        {diffContent}
      </pre>
    </Box>
  );
};

const AiEditorPage: React.FC = () => {
  const {
    instruction,
    loading,
    error,
    currentProjectPath,
    scanPathsInput,
    lastLlmResponse,
    selectedChanges,
    currentDiff,
    diffFilePath,
    applyingChanges,
    appliedMessages,
  } = useStore(aiEditorStore);
  const { isLoggedIn } = useStore(authStore);
  const [projectInput, setProjectInput] = useState<string>(
    currentProjectPath || import.meta.env.VITE_BASE_DIR || '',
  );

  useEffect(() => {
    if (currentProjectPath && projectInput !== currentProjectPath) {
      setProjectInput(currentProjectPath);
    }
    if (!projectInput && import.meta.env.VITE_BASE_DIR) {
      setProjectInput(import.meta.env.VITE_BASE_DIR);
      aiEditorStore.setKey('currentProjectPath', import.meta.env.VITE_BASE_DIR);
    }
  }, [currentProjectPath, projectInput]);

  useEffect(() => {
    // Clear diff when project or response changes
    clearDiff();
  }, [lastLlmResponse, currentProjectPath]);

  const handleInstructionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInstruction(event.target.value);
  };

  const handleScanPathsInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setScanPathsInput(event.target.value);
  };

  const handleProjectInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProjectInput(event.target.value);
  };

  const handleLoadProject = () => {
    if (!projectInput) return;
    aiEditorStore.setKey('currentProjectPath', projectInput);
    setError(null);
    setLastLlmResponse(null);
    setAppliedMessages([]);
    setCurrentDiff(null, null);
  };

  const handleGenerateCode = async () => {
    if (!instruction) {
      setError('Please provide instructions for the AI.');
      return;
    }
    if (!isLoggedIn) {
      setError('You must be logged in to use the AI Editor.');
      return;
    }
    if (!currentProjectPath) {
      setError('Please load a project first by entering a path above.');
      return;
    }

    setLoading(true);
    setError(null);
    setLastLlmResponse(null); // Clear previous response
    setCurrentDiff(null, null); // Clear any previous diff
    setAppliedMessages([]);

    try {
      const parsedScanPaths = scanPathsInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s !== '');

      const payload: LlmGeneratePayload = {
        userPrompt: instruction,
        projectRoot: currentProjectPath,
        projectStructure: '',
        relevantFiles: [],
        additionalInstructions: INSTRUCTION,
        expectedOutputFormat: ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT,
        scanPaths: parsedScanPaths,
      };

      const aiResponse: LlmResponse = await generateCode(payload);
      setLastLlmResponse(aiResponse); // Store the full structured response
    } catch (err) {
      setError(`Failed to generate code: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChange = (change: ProposedFileChange) => {
    toggleSelectedChange(change);
  };

  const handleShowDiff = async (change: ProposedFileChange) => {
    if (!currentProjectPath) {
      setError('Project root is not set.');
      return;
    }
    setLoading(true);
    setError(null);
    clearDiff();
    try {
      // For ADD actions, we don't have a file in git to diff against. We can show newContent.
      // For MODIFY/DELETE, we get a git diff.
      let diffContent: string;
      if (change.action === FileAction.ADD) {
        // Simulate diff for a new file: show its content as added
        diffContent = `--- /dev/null\n+++ a/${change.filePath}\n@@ -0,0 +1,${change.newContent?.split('\n').length || 1} @@\n${change.newContent
          ?.split('\n')
          .map((line) => `+${line}`)
          .join('\n')}`;
      } else {
        diffContent = await getGitDiff(change.filePath, currentProjectPath);
      }

      setCurrentDiff(change.filePath, diffContent);
    } catch (err) {
      setError(
        `Failed to get diff for ${change.filePath}: ${err instanceof Error ? err.message : String(err)}`,
      );
      setCurrentDiff(change.filePath, `Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySelectedChanges = async () => {
    if (Object.keys(selectedChanges).length === 0) {
      setError('No changes selected to apply.');
      return;
    }
    if (!currentProjectPath) {
      setError('Project root is not set.');
      return;
    }

    setApplyingChanges(true);
    setError(null);
    setAppliedMessages([]);

    try {
      const changesToApply = Object.values(selectedChanges);
      const result = await applyProposedChanges(changesToApply, currentProjectPath);
      setAppliedMessages(result.messages);
      if (!result.success) {
        setError('Some changes failed to apply. Check messages above.');
      }
      // Clear the response and selected changes after applying
      setLastLlmResponse(null);
      deselectAllChanges();
      clearDiff();
    } catch (err) {
      setError(`Failed to apply changes: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setApplyingChanges(false);
    }
  };

  const getFileActionChipColor = (action: FileAction) => {
    switch (action) {
      case FileAction.ADD:
        return 'success';
      case FileAction.MODIFY:
        return 'info';
      case FileAction.DELETE:
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" className="py-8">
      <Paper elevation={3} className="p-6 mb-8">
        <Typography variant="h4" component="h1" gutterBottom className="!font-bold !text-blue-700">
          AI Code Editor
        </Typography>
        <Typography variant="body1" color="text.secondary" className="mb-4">
          Provide instructions to the AI to generate or modify code in your project. Start by
          loading your project.
        </Typography>

        {!isLoggedIn && (
          <Alert severity="warning" className="mb-4">
            You need to be logged in to use the AI Editor functionality.
          </Alert>
        )}

        <Box className="mb-6 flex gap-4 items-center flex-wrap">
          <TextField
            label="Project Root Path"
            value={projectInput}
            onChange={handleProjectInputChange}
            placeholder="e.g., /home/user/my-project"
            disabled={loading || applyingChanges}
            sx={{ flexGrow: 1 }}
            size="small"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleLoadProject}
            disabled={loading || !projectInput || applyingChanges}
            sx={{ flexShrink: 0 }}
          >
            Load Project
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={clearState}
            disabled={loading || applyingChanges}
            sx={{ flexShrink: 0 }}
          >
            Clear All
          </Button>
        </Box>

        {currentProjectPath && (
          <Box className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
            <Typography variant="h6" className="!font-semibold !text-gray-800">
              Current Project Root:
              <span className="font-normal text-blue-600"> {currentProjectPath}</span>
            </Typography>
            <Typography variant="body2" className="text-gray-600 mt-2">
              AI will scan paths specified below within this project root.
            </Typography>
          </Box>
        )}

        <TextField
          label="Scan Paths (comma-separated relative paths)"
          value={scanPathsInput}
          onChange={handleScanPathsInputChange}
          placeholder="e.g., src/components,package.json,README.md"
          disabled={loading || !isLoggedIn || !currentProjectPath || applyingChanges}
          fullWidth
          margin="normal"
          helperText="Paths where the AI should focus its analysis for project structure and relevant files (relative to project root)."
        />

        <TextField
          label="AI Instructions (User Prompt)"
          multiline
          rows={6}
          value={instruction}
          onChange={handleInstructionChange}
          placeholder="e.g., Implement a new user authentication module with JWT. Include login and register endpoints."
          disabled={loading || !isLoggedIn || !currentProjectPath || applyingChanges}
          fullWidth
          margin="normal"
        />

        <Button
          variant="contained"
          color="success"
          onClick={handleGenerateCode}
          disabled={
            loading || !instruction || !isLoggedIn || !currentProjectPath || applyingChanges
          }
          sx={{ mt: 3, py: 1.5, px: 4, fontSize: '1.05rem' }}
        >
          {loading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : null}
          Generate/Modify Code
        </Button>

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {applyingChanges && ( // Show applying changes indicator
          <Alert severity="info" sx={{ mt: 3 }}>
            Applying selected changes...
            <CircularProgress size={16} color="inherit" sx={{ ml: 1 }} />
          </Alert>
        )}

        {appliedMessages.length > 0 && ( // Show messages after applying changes
          <Paper
            elevation={1}
            sx={{ mt: 3, p: 2, bgcolor: 'background.paper', border: '1px solid #ddd' }}
          >
            <Typography variant="h6" className="!font-semibold !text-gray-800" gutterBottom>
              Application Summary:
            </Typography>
            <Box
              sx={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                maxHeight: '200px',
                overflowY: 'auto',
                p: 1,
                bgcolor: 'grey.50',
                borderRadius: 1,
              }}
            >
              {appliedMessages.map((msg, index) => (
                <Typography key={index} component="div" sx={{ mb: 0.5 }}>
                  {msg}
                </Typography>
              ))}
            </Box>
          </Paper>
        )}

        {lastLlmResponse && (
          <Paper elevation={1} sx={{ mt: 3, p: 3, bgcolor: 'background.paper' }}>
            <Typography variant="h5" className="!font-bold !text-blue-700" gutterBottom>
              AI Proposed Changes:
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {lastLlmResponse.summary}
            </Typography>
            {lastLlmResponse.thoughtProcess && (
              <Accordion sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" className="!font-semibold">
                    AI Thought Process
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography
                    sx={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      bgcolor: 'grey.50',
                      p: 2,
                      borderRadius: 1,
                      overflowX: 'auto',
                    }}
                  >
                    {lastLlmResponse.thoughtProcess}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            )}

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                variant="outlined"
                onClick={selectAllChanges}
                disabled={loading || applyingChanges}
              >
                Select All
              </Button>
              <Button
                variant="outlined"
                onClick={deselectAllChanges}
                disabled={loading || applyingChanges}
              >
                Deselect All
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleApplySelectedChanges}
                disabled={loading || applyingChanges || Object.keys(selectedChanges).length === 0}
                startIcon={applyingChanges ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {applyingChanges ? 'Applying...' : 'Apply Selected Changes'}
              </Button>
            </Box>

            <Typography
              variant="h6"
              className="!font-semibold !text-gray-800"
              sx={{ mt: 3, mb: 2 }}
            >
              Detailed Changes:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {lastLlmResponse.changes.map((change, index) => (
                <Paper key={index} elevation={2} sx={{ p: 2, bgcolor: 'background.paper' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!selectedChanges[change.filePath]}
                          onChange={() => handleToggleChange(change)}
                          disabled={loading || applyingChanges}
                        />
                      }
                      label={
                        <Chip
                          label={change.action.toUpperCase()}
                          color={getFileActionChipColor(change.action)}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                      }
                    />
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', flexGrow: 1 }}>
                      {change.filePath}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => handleShowDiff(change)}
                      disabled={loading || applyingChanges}
                    >
                      Show Diff
                    </Button>
                  </Box>
                  {change.reason && (
                    <Typography variant="body2" color="text.secondary" sx={{ pl: 4, mb: 1 }}>
                      Reason: {change.reason}
                    </Typography>
                  )}

                  {diffFilePath === change.filePath && currentDiff && (
                    <DiffViewer diffContent={currentDiff} filePath={change.filePath} />
                  )}
                </Paper>
              ))}
            </Box>
          </Paper>
        )}
      </Paper>
    </Container>
  );
};

export default AiEditorPage;
