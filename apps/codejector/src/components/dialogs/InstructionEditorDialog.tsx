import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { useStore } from '@nanostores/react';
import {
  llmStore,
  setAiInstruction,
  setExpectedOutputInstruction,
} from '@/stores/llmStore'; // Import aiEditorStore
// Import LlmOutputFormat

interface InstructionEditorDialogProps {
  open: boolean;
  onClose: () => void;
  type: 'ai' | 'expected';
}

const InstructionEditorDialog: React.FC<InstructionEditorDialogProps> = ({
  open,
  onClose,
  type,
}) => {
  const store = useStore(llmStore).get();
  const aiInstruction = store.aiInstruction;
  const expectedOutputInstruction = store.expectedOutputInstruction;

  const [localValue, setLocalValue] = useState(
    type === 'ai' ? aiInstruction : expectedOutputInstruction,
  );

  useEffect(() => {
    setLocalValue(type === 'ai' ? aiInstruction : expectedOutputInstruction);
  }, [type, aiInstruction, expectedOutputInstruction]);

  const handleSave = () => {
    if (type === 'ai') setAiInstruction(localValue);
    else setExpectedOutputInstruction(localValue);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {type === 'ai'
          ? 'Edit AI Instructions'
          : 'Edit Expected Output Instructions'}
      </DialogTitle>
      <DialogContent>
        <TextField
          multiline
          rows={6}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          fullWidth
          size="small"
          autoFocus
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InstructionEditorDialog;
