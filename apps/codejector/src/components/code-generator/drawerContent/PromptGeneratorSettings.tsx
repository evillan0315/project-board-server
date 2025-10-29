import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Box, Tabs, Tab, useTheme } from '@mui/material';
import SchemaIcon from '@mui/icons-material/Schema';
import ExampleIcon from '@mui/icons-material/Code';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DescriptionIcon from '@mui/icons-material/Description';
import { useStore } from '@nanostores/react';
import {
  INSTRUCTION_SCHEMA_OUTPUT,
  INSTRUCTION_EXAMPLE_OUTPUT,
} from '@/constants/instructions';
import {
  llmStore,
  setAiInstruction,
  setExpectedOutputInstruction,
} from '@/stores/llmStore';
import CodeMirrorEditor from '@/components/codemirror/CodeMirrorEditor';
import MarkdownEditor from '@/components/MarkdownEditor';
import AiSchemaGenerator from '@/components/schema/AiSchemaGenerator';
import { debounce } from '@/utils/debounce';


interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      className='h-full'
    >
      {value === index && (
        <Box sx={{ p: 2, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const PromptGeneratorSettings: React.FC = () => {
  const theme = useTheme();
  const { aiInstruction, expectedOutputInstruction } = useStore(llmStore);
  const [tab, setTab] = React.useState(0); // 0 = General Instruction, 1 = JSON Schema, 2 = Example Output, 3 = AI Schema Generator

  /** Local editable state for General Instruction, synchronized with store via debounce */
  const [localAiInstruction, setLocalAiInstruction] = useState(aiInstruction);

  /** Local editable states for Instruction Schema and Example, derived from and updating expectedOutputInstruction */
  const [localInstructionSchema, setLocalInstructionSchema] = useState('');
  const [localInstructionExample, setLocalInstructionExample] = useState('');

  // Regex to parse the expectedOutputInstruction string into schema and example parts
  const schemaRegex = /The response MUST be a single JSON object that validates against the schema:\n\n```json\n([\s\S]*?)\n```\n\nExample valid output:\n\n```json\n([\s\S]*?)\n```/;

  // --- Effects for Synchronization ---

  // Sync localAiInstruction with global store on initial load or external changes
  useEffect(() => {
    setLocalAiInstruction(aiInstruction);
  }, [aiInstruction]);

  // Parse expectedOutputInstruction from store to local schema/example states
  useEffect(() => {
    const match = expectedOutputInstruction.match(schemaRegex);
    if (match) {
      setLocalInstructionSchema(match[1].trim());
      setLocalInstructionExample(match[2].trim());
    } else {
      // Fallback if format doesn't match, e.g., if it's just raw text.
      // Attempt to set it as example, as schema is unlikely if the format is broken.
      setLocalInstructionSchema(INSTRUCTION_SCHEMA_OUTPUT); // Default or clear if cannot parse
      setLocalInstructionExample(expectedOutputInstruction.trim() || INSTRUCTION_EXAMPLE_OUTPUT); // Default or clear if cannot parse
    }
  }, [expectedOutputInstruction]); // Re-parse if the global expectedOutputInstruction changes

  // --- Debounced Store Update Functions ---

  const debouncedSetAiInstruction = useMemo(
    () => debounce((value: string) => setAiInstruction(value), 300),
    [],
  );

  const debouncedSetExpectedOutputInstruction = useMemo(
    () =>
      debounce((schema: string, example: string) => {
        const mergedAdditionalInstruction = `The response MUST be a single JSON object that validates against the schema: ${schema}`;
        setExpectedOutputInstruction(mergedAdditionalInstruction);
      }, 500),
    [],
  );

  // Cleanup debounced functions on unmount
  useEffect(() => () => {
    debouncedSetAiInstruction.cancel();
    debouncedSetExpectedOutputInstruction.cancel();
  }, [debouncedSetAiInstruction, debouncedSetExpectedOutputInstruction]);

  // --- Event Handlers ---

  const handleAiInstructionChange = useCallback(
    (value: string) => {
      setLocalAiInstruction(value);
      debouncedSetAiInstruction(value);
    },
    [debouncedSetAiInstruction],
  );

  const handleSchemaChange = useCallback(
    (value: string) => {
      setLocalInstructionSchema(value);
      debouncedSetExpectedOutputInstruction(value, localInstructionExample);
    },
    [localInstructionExample, debouncedSetExpectedOutputInstruction],
  );

  const handleExampleChange = useCallback(
    (value: string) => {
      setLocalInstructionExample(value);
      debouncedSetExpectedOutputInstruction(localInstructionSchema, value);
    },
    [localInstructionSchema, debouncedSetExpectedOutputInstruction],
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        textColor="primary"
        indicatorColor="primary"
        centered
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Prompt Generator Settings Tabs"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="General Instruction" icon={<DescriptionIcon />} {...a11yProps(0)} />
        <Tab label="Instruction Schema" icon={<SchemaIcon />} {...a11yProps(1)} />
        <Tab label="Example Output" icon={<ExampleIcon />} {...a11yProps(2)} />
        <Tab label="AI Schema Generator" icon={<AutoAwesomeIcon />} {...a11yProps(3)} />
      </Tabs>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p:0, pt:1 }}>
   
        <CustomTabPanel value={tab} index={0}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Define the overall instructions for the AI. This is Markdown-compatible and acts as the system prompt.
          </Typography>
          <Box
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              overflow: 'hidden',
              mb: 2,
              height: 'calc(100% - 60px)', // Adjust height based on Typography
            }}
          >
            <MarkdownEditor
              value={localAiInstruction}
              initialValue={aiInstruction} // Use initial value from store for MarkdownEditor's internal state
              onChange={handleAiInstructionChange}
              expectedSchema={localInstructionSchema}
              exampleOutput={localInstructionExample}
            />
          </Box>
        </CustomTabPanel>

        {/* ---------- Instruction Schema (CodeMirror JSON Editor) ---------- */}
        <CustomTabPanel value={tab} index={1}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Provide the JSON schema that the AI's output should conform to.
          </Typography>
          <Box
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              overflow: 'hidden',
              height: 'calc(100% - 60px)',
            }}
          >
            <CodeMirrorEditor
              value={localInstructionSchema}
              onChange={handleSchemaChange}
              language="json"
              filePath="schema.json"
              height="100%"
            />
          </Box>
        </CustomTabPanel>

        {/* ---------- Example Output (CodeMirror JSON Editor) ---------- */}
        <CustomTabPanel value={tab} index={2}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Provide a valid JSON example that demonstrates the desired output structure.
          </Typography>
          <Box
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              overflow: 'hidden',
              height: 'calc(100% - 60px)',
            }}
          >
            <CodeMirrorEditor
              value={localInstructionExample}
              onChange={handleExampleChange}
              language="json"
              filePath="example.json"
              height="100%"
            />
          </Box>
        </CustomTabPanel>

        {/* ---------- AI Schema Generator ---------- */}
        <CustomTabPanel value={tab} index={3}>
          <AiSchemaGenerator />
        </CustomTabPanel>
      </Box>
    </Box>
  );
};

export default PromptGeneratorSettings;
