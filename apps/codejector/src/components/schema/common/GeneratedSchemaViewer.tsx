/**
 * @module GeneratedSchemaViewer
 * @description Displays the currently generated JSON schema using a CodeMirror editor.
 * Allows for manual editing of the schema and updates the schema store accordingly.
 */

import React, { useCallback, useState } from 'react';
import { Box, Typography, Paper, IconButton } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import ArticleIcon from '@mui/icons-material/Article';
import CloseIcon from '@mui/icons-material/Close';
import CodeMirrorEditor from '@/components/codemirror/CodeMirrorEditor';
import { useStore } from '@nanostores/react';
import { schemaStore } from '@/stores/schemaStore';
import DynamicFormBuilder from './DynamicFormBuilder';
import { JsonSchema } from '@/types/schema';

/**
 * Props for the GeneratedSchemaViewer component.
 */
interface GeneratedSchemaViewerProps {
  // Optionally, if the parent wants to react to direct editor changes, pass a callback
  // For now, it updates the store directly.
}

// Sample JSON Schema for demonstration
const SAMPLE_JSON_SCHEMA: JsonSchema = {
  type: 'object',
  $id: 'https://example.com/project-metadata.schema.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Software Project Metadata',
  description:
    "A schema defining the structure for a software project's metadata.",
  properties: {
    projectName: {
      type: 'string',
      title: 'Project Name',
      description: 'The name of the software project.',
      default: 'My Awesome Project',
    },
    version: {
      type: 'string',
      title: 'Version',
      default: '1.0.0',
    },
    isPublic: {
      type: 'boolean',
      title: 'Is Public?',
      description: 'Indicates if the project is publicly accessible.',
      default: false,
    },
    teamSize: {
      type: 'number',
      title: 'Team Size',
      minimum: 1,
      default: 5,
    },
    technologies: {
      type: 'array',
      title: 'Technologies Used',
      items: {
        type: 'string',
      },
      default: ['React', 'TypeScript', 'NestJS'],
    },
    manager: {
      type: 'object',
      title: 'Project Manager',
      description: 'Details about the project manager.',
      properties: {
        name: { type: 'string', title: 'Manager Name', default: 'John Doe' },
        email: { type: 'string', title: 'Manager Email', format: 'email' },
        contact: {
          type: 'object',
          title: 'Contact Info',
          properties: {
            phone: { type: 'string', title: 'Phone Number' },
            slackId: { type: 'string', title: 'Slack ID' },
          },
        },
      },
      required: ['name'],
    },
    startDate: {
      type: 'string',
      title: 'Start Date',
      format: 'date',
    },
    status: {
      type: 'string',
      title: 'Project Status',
      enum: ['Planning', 'In Progress', 'Completed', 'On Hold'],
      default: 'Planning',
    },
    projects: {
      type: 'array',
      title: 'Related Projects',
      description: 'List of related sub-projects or modules.',
      items: {
        type: 'object',
        title: 'Sub-Project',
        properties: {
          id: { type: 'string', title: 'Sub-Project ID', format: 'uuid' },
          name: { type: 'string', title: 'Sub-Project Name' },
          budget: { type: 'number', title: 'Budget (USD)', minimum: 0 },
          lead: { type: 'string', title: 'Project Lead' },
          tasks: {
            type: 'array',
            title: 'Tasks',
            items: {
              type: 'string',
            },
          },
        },
        required: ['id', 'name'],
      },
    },
  },
  required: ['projectName', 'teamSize'],
};

const GeneratedSchemaViewer: React.FC<GeneratedSchemaViewerProps> = () => {
  const $schema = useStore(schemaStore);
  const [showDynamicForm, setShowDynamicForm] = useState(false);

  // Handle direct edits (paste, type) in the generated schema editor
  const handleGeneratedSchemaEditorChange = useCallback((newValue: string) => {
    try {
      const parsed = JSON.parse(newValue);
      schemaStore.set(parsed);
    } catch (error) {
      console.error('Invalid JSON in generated schema editor:', error);
      // Optionally, show a temporary error message to the user
    }
  }, []);

  const handleLoadSampleSchema = useCallback(() => {
    schemaStore.set(SAMPLE_JSON_SCHEMA);
    setShowDynamicForm(false); // Switch back to schema view if form was open
  }, []);

  const handleToggleView = useCallback(() => {
    setShowDynamicForm((prev) => !prev);
  }, []);

  return (
    <Paper className="p-4 w-full mt-2">
      <Box className="flex justify-between items-center mb-2">
        <Typography variant="subtitle1" gutterBottom className="mb-0">
          Generated Schema (Editable):
        </Typography>
        <Box>
          <IconButton
            aria-label="load sample schema"
            onClick={handleLoadSampleSchema}
            size="small"
          >
            <CodeIcon />
          </IconButton>
          <IconButton
            aria-label="toggle form view"
            onClick={handleToggleView}
            size="small"
          >
            {showDynamicForm ? <CloseIcon /> : <ArticleIcon />}
          </IconButton>
        </Box>
      </Box>
      {showDynamicForm ? (
        <DynamicFormBuilder schema={$schema} />
      ) : (
        <CodeMirrorEditor
          value={JSON.stringify($schema, null, 2)}
          language="json"
          filePath="schema.json"
          onChange={handleGeneratedSchemaEditorChange}
          height="400px"
          width="100%"
        />
      )}
    </Paper>
  );
};

export default GeneratedSchemaViewer;
