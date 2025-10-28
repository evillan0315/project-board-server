import React, { useState, useEffect, useCallback } from 'react';
import { TextField, Typography, Box } from '@mui/material';
import { useStore } from '@nanostores/react';
import { llmStore, setAiInstruction, setExpectedOutputInstruction } from '@/stores/llmStore';
import CustomDrawer from '@/components/Drawer/CustomDrawer';
import type { GlobalAction } from '@/types/app';
import ClearIcon from '@mui/icons-material/Clear';
import SaveIcon from '@mui/icons-material/Save';

interface InstructionEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  type: 'ai' | 'expected';
}

const InstructionEditorDrawer: React.FC<InstructionEditorDrawerProps> = ({
  open,
  onClose,
  type,
}) => {
  const store = useStore(llmStore);
  const aiInstruction = store.aiInstruction;
  const expectedOutputInstruction = store.expectedOutputInstruction;

  const [localValue, setLocalValue] = useState<string>('');

  useEffect(() => {
    if (type === 'ai') {
      setLocalValue(aiInstruction);
    } else {
      setLocalValue(expectedOutputInstruction);
    }
  }, [type, aiInstruction, expectedOutputInstruction, open]); // Re-initialize localValue when drawer opens or type/store values change

  const handleSave = useCallback(() => {
    if (type === 'ai') {
      setAiInstruction(localValue);
    } else {
      setExpectedOutputInstruction(localValue);
    }
    onClose();
  }, [type, localValue, onClose]);

  const handleCancel = useCallback(() => {
    // Revert local changes if canceled
    if (type === 'ai') {
      setLocalValue(aiInstruction);
    } else {
      setLocalValue(expectedOutputInstruction);
    }
    onClose();
  }, [type, aiInstruction, expectedOutputInstruction, onClose]);

  const drawerTitle = type === 'ai' ? 'Edit AI Instructions' : 'Edit Expected Output Instructions';

  const drawerActions: GlobalAction[] = [
    { label: 'Cancel', action: handleCancel, icon: <ClearIcon />, color: 'text', variant: 'outlined' },
    { label: 'Save', action: handleSave, icon: <SaveIcon />, color: 'primary', variant: 'contained' },
  ];

  return (
    <CustomDrawer
      open={open}
      onClose={handleCancel} // Use handleCancel for consistent behavior on close
      position="right"
      size="medium"
      title={drawerTitle}
      hasBackdrop={true}
      footerActionButton={drawerActions}
    >
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {type === 'ai'
            ? "Define the overall instructions for the AI. This is Markdown-compatible and acts as the system prompt." // Double quotes escaped
            : "Provide the desired output format and structure, typically a JSON schema or an example of a valid response."
          }
        </Typography>
        <TextField
          multiline
          rows={10}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          fullWidth
          size="small"
          autoFocus
          variant="outlined"
          sx={{ flexGrow: 1, '.MuiInputBase-root': { height: '100%', alignItems: 'flex-start' } }}
          InputProps={{ style: { fontFamily: 'monospace' } }}
        />
      </Box>
    </CustomDrawer>
  );
};

export default InstructionEditorDrawer;
