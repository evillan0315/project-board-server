/**
 * @module SchemaInstructionGenerator
 * @description Provides an interface for generating schema from a natural language instruction.
 * Also includes functionality to apply the currently generated schema to a new instruction.
 */

import React from 'react';
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';

/**
 * Props for the SchemaInstructionGenerator component.
 */
interface SchemaInstructionGeneratorProps {
  instruction: string;
  onInstructionChange: (instruction: string) => void;
  onGenerateSchemaFromInstruction: () => void;
  loading: boolean;
  applyInstruction: string;
  onApplyInstructionChange: (instruction: string) => void;
  onApplySchemaToInstruction: () => void;
}

const SchemaInstructionGenerator: React.FC<SchemaInstructionGeneratorProps> = ({
  instruction,
  onInstructionChange,
  onGenerateSchemaFromInstruction,
  loading,
  applyInstruction,
  onApplyInstructionChange,
  onApplySchemaToInstruction,
}) => (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Generate Schema from Instruction:
      </Typography>
      <TextField
        label="Instruction"
        fullWidth
        multiline
        rows={4}
        value={instruction}
        onChange={(e) => onInstructionChange(e.target.value)}
        margin="normal"
      />
      <Button
        variant="contained"
        color="primary"
        onClick={onGenerateSchemaFromInstruction}
        disabled={loading}
      >
        {loading ? (
          <CircularProgress size={24} />
        ) : (
          'Generate Schema from Instruction'
        )}
      </Button>

      <Box mt={3}>
        <Typography variant="subtitle1" gutterBottom>
          Apply Schema To Instruction:
        </Typography>
        <TextField
          label="Instruction for Schema Application"
          fullWidth
          multiline
          rows={4}
          value={applyInstruction}
          onChange={(e) => onApplyInstructionChange(e.target.value)}
          margin="normal"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={onApplySchemaToInstruction}
        >
          Apply Generated Schema To Instruction
        </Button>
      </Box>
    </Box>
  );

export default SchemaInstructionGenerator;
