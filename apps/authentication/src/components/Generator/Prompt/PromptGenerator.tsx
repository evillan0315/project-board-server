import React, { useState, useEffect, useMemo, useCallback, ChangeEvent } from 'react';
import {
  Box,
  Button,
  Chip,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  AddRoad as AddRoadIcon,
  CloudUpload as CloudUploadIcon,
  ContentPaste as ContentPasteIcon,
  DeleteForever as DeleteForeverIcon,
  EditNote as EditNoteIcon,
} from '@mui/icons-material';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import { projectRootDirectoryStore } from '@/stores/fileTreeStore';
import {
  aiEditorStore,
  setScanPathsInput,
  addScanPath,
  removeScanPath,
  setUploadedFile,
  generateCodeFromAI,
  setInstruction,
  setAiInstruction,
  setExpectedOutputInstruction,
  setLlmOutputFormat,
  setAutoApplyChanges,
  clearState,
  showGlobalSnackbar,
} from '@/stores/aiEditorStore';
import { LlmOutputFormat, LlmOutputFormatValues } from '@/types/llm';
import { INSTRUCTION, YAML_INSTRUCTION, ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT, YAML_ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT, MARKDOWN_ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT, TEXT_ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT } from '@/constants/instructions';

const truncatePath = (path: string, maxLength = 30) => {
  if (path.length <= maxLength) return path;
  const lastSlash = path.lastIndexOf('/');
  if (lastSlash !== -1 && path.length - lastSlash < maxLength - 5) {
    const fileName = path.slice(lastSlash + 1);
    const prefix = path.slice(0, lastSlash);
    const truncatedPrefix =
      prefix.length > maxLength - fileName.length - 3
        ? '...' + prefix.slice(-(maxLength - fileName.length - 3))
        : prefix;
    return `${truncatedPrefix}/${fileName}`;
  }
  return `${path.slice(0, maxLength - 3)}...`;
};

const PromptGenerator: React.FC = () => {
  const theme = useTheme();
  const state = useStore(aiEditorStore);
  const { isLoggedIn } = useStore(authStore);
  const projectRootDirectory = useStore(projectRootDirectoryStore);

  const [searchTerm, setSearchTerm] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [base64Input, setBase64Input] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [editingInstructionType, setEditingInstructionType = useState<'ai' | 'expected' | null>(null);

  const commonDisabled = !isLoggedIn || state.applyingChanges || state.isBuilding;

  // --- Scan Paths as array ---
  const scanPathsArray = useMemo(
    () => state.scanPathsInput.split(',').map(p => p.trim()).filter(Boolean),
    [state.scanPathsInput]
  );

  // --- Sync instructions with output format ---
  useEffect(() => {
    let expected = ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT, instr = INSTRUCTION;
    switch (state.llmOutputFormat) {
      case LlmOutputFormat.YAML:
        expected = YAML_ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT;
        instr = YAML_INSTRUCTION;
        break;
      case LlmOutputFormat.MARKDOWN:
        expected = MARKDOWN_ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT;
        break;
      case LlmOutputFormat.TEXT:
        expected = TEXT_ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT;
        break;
    }
    if (state.expectedOutputInstruction !== expected) setExpectedOutputInstruction(expected);
    if (state.aiInstruction !== instr) setAiInstruction(instr);
  }, [state.llmOutputFormat]);

  /** ---------- File Upload / Base64 Handling ---------- **/
  const handleFileRead = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      setUploadedFile(base64, file.type);
      setBase64Input(dataUrl);
      setFileError(null);
    };
    reader.onerror = () => {
      setFileError('Failed to read file.');
      setUploadedFile(null, null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = useCallback((files: FileList | null) => {
    if (files?.length) handleFileRead(files[0]);
    else setFileError('No file selected.');
  }, [handleFileRead]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleFileChange(e.dataTransfer.files);
    e.dataTransfer.clearData();
  }, [handleFileChange]);

  const handlePasteBase64 = useCallback(() => {
    const regex = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+)?;base64,([a-zA-Z0-9+/=]+)$/;
    const match = base64Input.match(regex);
    if (match) {
      const mimeType = match[1] || 'application/octet-stream';
      const base64Data = match[2];
      setUploadedFile(base64Data, mimeType);
      setFileError(null);
    } else {
      setFileError('Invalid Base64 data URL format.');
      setUploadedFile(null, null);
    }
  }, [base64Input]);

  const handleClearUpload = useCallback(() => {
    setBase64Input('');
    setFileError(null);
    setUploadedFile(null, null);
  }, []);

  /** ---------- Handlers for Scan Paths ---------- **/
  const handleRemovePath = (path: string) => removeScanPath(path);

  const handleAddDummyPath = () => {
    const dummyPath = `new-file-${Math.floor(Math.random() * 1000)}.ts`;
    addScanPath(dummyPath);
  };

  /** ---------- Instruction Editing ---------- **/
  const handleEditInstruction = (type: 'ai' | 'expected') => setEditingInstructionType(type);

  /** ---------- Confirm Generate ---------- **/
  const handleGenerate = () => generateCodeFromAI();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
      {/* Scan Paths */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {scanPathsArray.map(path => (
          <Chip
            key={path}
            label={truncatePath(path)}
            onDelete={() => handleRemovePath(path)}
            disabled={commonDisabled}
            deleteIcon={<CloseIcon fontSize="small" />}
            size="small"
          />
        ))}
        <IconButton onClick={handleAddDummyPath} disabled={commonDisabled} size="small">
          <AddRoadIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* File Upload */}
      {fileError && <Alert severity="error">{fileError}</Alert>}
      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          border: `2px dashed ${dragActive ? theme.palette.primary.main : theme.palette.divider}`,
          borderRadius: 1,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: dragActive ? theme.palette.action.hover : theme.palette.background.default,
          transition: 'all 0.2s ease-in-out',
        }}
      >
        <input type="file" onChange={e => handleFileChange(e.target.files)} style={{ display: 'none' }} id="file-upload-input" />
        <label htmlFor="file-upload-input">
          <CloudUploadIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />
          <Typography variant="body2" color="text.secondary">Drag files here or click to browse</Typography>
        </label>
      </Box>
      <TextField
        label="Base64 Data URL"
        multiline rows={4}
        value={base64Input}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setBase64Input(e.target.value)}
        fullWidth
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 1 }}
      />
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button onClick={handlePasteBase64} variant="contained" startIcon={<ContentPasteIcon />} disabled={!base64Input}>Apply Base64</Button>
        <Button onClick={handleClearUpload} variant="outlined" startIcon={<DeleteForeverIcon />} disabled={!base64Input && !state.uploadedFileData}>Clear</Button>
      </Box>
      {state.uploadedFileData && (
        <Alert severity="info">
          File uploaded: <strong>{state.uploadedFileMimeType || 'unknown'}</strong> ({(state.uploadedFileData.length / 1024).toFixed(2)} KB)
        </Alert>
      )}

      {/* AI Instruction */}
      <TextField
        label="AI Instructions"
        multiline
        rows={2}
        value={state.instruction}
        onChange={e => setInstruction(e.target.value)}
        placeholder="Enter AI instructions..."
        fullWidth
        disabled={commonDisabled}
      />

      {/* Output Format & Auto-Apply */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <FormControl size="small">
          <InputLabel>Output</InputLabel>
          <Select
            value={state.llmOutputFormat}
            onChange={e => setLlmOutputFormat(e.target.value as LlmOutputFormat)}
          >
            {LlmOutputFormatValues.map(f => <MenuItem key={f} value={f}>{f.toUpperCase()}</MenuItem>)}
          </Select>
        </FormControl>
        <IconButton onClick={() => handleEditInstruction('ai')} size="small"><EditNoteIcon fontSize="small" /></IconButton>
        <FormControlLabel
          control={<Switch checked={state.autoApplyChanges} onChange={e => setAutoApplyChanges(e.target.checked)} />}
          label="Auto-apply"
        />
      </Box>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={commonDisabled || !state.instruction || !projectRootDirectory}
        variant="contained"
      >
        {state.isBuilding ? <CircularProgress size={16} /> : 'Generate/Modify Code'}
      </Button>
    </Box>
  );
};

export default PromptGenerator;