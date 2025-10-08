/**
 * @module SchemaPropertiesEditor
 * @description Manages and renders a list of `SchemaPropertyField` components for manual schema definition.
 * Provides functionality to add, update, and delete schema properties, including nested ones.
 */

import React, { useCallback, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { nanoid } from 'nanoid';
import { SchemaProperty } from './SchemaPropertyTypes';
import SchemaPropertyField from './SchemaPropertyField';
import { useStore } from '@nanostores/react';
import { schemaStore } from '@/stores/schemaStore';
import { schemaApi } from '@/api/schema';
import { CreateSchemaPayload } from '@/types/schema';

/**
 * Props for the SchemaPropertiesEditor component.
 */
interface SchemaPropertiesEditorProps {
  properties: SchemaProperty[];
  onPropertiesChange: (newProperties: SchemaProperty[]) => void;
  onGenerateSchema: () => void;
  schemaId: string;
  onSchemaIdChange: (id: string) => void;
  metaSchemaUrl: string;
  onMetaSchemaUrlChange: (url: string) => void;
  schemaTitle: string;
  onSchemaTitleChange: (title: string) => void;
  schemaDescription: string;
  onSchemaDescriptionChange: (description: string) => void;
  schemaLayout: string; // New prop for top-level x-layout
  onSchemaLayoutChange: (layout: string) => void; // New handler for top-level x-layout
}

const SchemaPropertiesEditor: React.FC<SchemaPropertiesEditorProps> = ({
  properties,
  onPropertiesChange,
  onGenerateSchema,
  schemaId,
  onSchemaIdChange,
  metaSchemaUrl,
  onMetaSchemaUrlChange,
  schemaTitle,
  onSchemaTitleChange,
  schemaDescription,
  onSchemaDescriptionChange,
  schemaLayout, // New prop
  onSchemaLayoutChange, // New prop
}) => {
  const $schema = useStore(schemaStore);
  const [creatingSchema, setCreatingSchema] = useState(false);

  // Helper function to update a property deeply nested in the state
  const updatePropertyByPath = useCallback(
    (
      currentProps: SchemaProperty[],
      path: string[],
      field: keyof SchemaProperty,
      value: any,
    ): SchemaProperty[] => {
      if (!currentProps || path.length === 0) return currentProps;

      const [targetId, ...restPath] = path;

      return currentProps.map((prop) => {
        if (prop.id === targetId) {
          if (restPath.length === 0) {
            // This is the direct target property to update
            return { ...prop, [field]: value };
          } else {
            // This prop is an ancestor, continue traversing down
            if (prop.type === 'object' && prop.properties) {
              const updatedProperties = updatePropertyByPath(
                prop.properties,
                restPath,
                field,
                value,
              );
              return { ...prop, properties: updatedProperties };
            } else if (prop.type === 'array' && prop.items) {
              // The next ID in restPath must be the ID of `prop.items` if we're going into it
              const updatedItems = updatePropertyByPath(
                [prop.items],
                restPath,
                field,
                value,
              )[0];
              return { ...prop, items: updatedItems };
            }
          }
        }
        return prop;
      });
    },
    [],
  );

  // Helper to add a nested property or array item schema
  const addNestedPropertyByPath = useCallback(
    (
      currentProps: SchemaProperty[],
      path: string[],
      type: 'item' | 'property',
    ):
      | SchemaProperty[]
      | undefined => {
      if (!currentProps || path.length === 0) return currentProps;

      const [targetId, ...restPath] = path;

      return currentProps.map((prop) => {
        if (prop.id === targetId) {
          if (restPath.length === 0) {
            // This is the parent property where we add
            const newId = nanoid();
            const newProp: SchemaProperty = {
              id: newId,
              name: type === 'item' ? 'newItemSchema' : 'newProperty',
              type: 'string',
              required: false,
              showOptions: false,
              showChildren: false,
            };

            if (type === 'item' && prop.type === 'array') {
              return { ...prop, items: newProp, showChildren: true };
            } else if (type === 'property' && prop.type === 'object') {
              return {
                ...prop,
                properties: [...(prop.properties || []), newProp],
                showChildren: true,
              };
            }
            return prop;
          } else {
            // Traverse deeper to find the actual parent for the add operation
            if (prop.type === 'object' && prop.properties) {
              const updatedProperties = addNestedPropertyByPath(
                prop.properties,
                restPath,
                type,
              );
              return { ...prop, properties: updatedProperties };
            } else if (prop.type === 'array' && prop.items) {
              const updatedItems = addNestedPropertyByPath(
                [prop.items],
                restPath,
                type,
              )?.[0]; // Use optional chaining because addNestedPropertyByPath can return undefined.
              return { ...prop, items: updatedItems };
            }
          }
        }
        return prop;
      });
    },
    [],
  );

  // Helper to delete a property deeply nested in the state
  const deletePropertyByPath = useCallback(
    (currentProps: SchemaProperty[], path: string[]): SchemaProperty[] => {
      if (!currentProps || path.length === 0) return currentProps;

      const [segmentId, ...restPath] = path;

      if (restPath.length === 0) {
        // This is the direct target to delete from currentProps
        return currentProps.filter((prop) => prop.id !== segmentId);
      } else {
        // Find the parent and recurse to delete the child
        return currentProps.map((prop) => {
          if (prop.id === segmentId) {
            if (prop.type === 'object' && prop.properties) {
              const updatedProperties = deletePropertyByPath(
                prop.properties,
                restPath,
              );
              return { ...prop, properties: updatedProperties };
            } else if (prop.type === 'array' && prop.items) {
              // The next segment should be the ID of the item schema to delete or an item within it.
              if (restPath.length === 1 && prop.items.id === restPath[0]) {
                return { ...prop, items: undefined }; // Delete the whole items schema
              } else {
                // If there's more path, it's a property within the item's object schema
                const updatedItems = deletePropertyByPath(
                  [prop.items],
                  restPath,
                )[0]; // Recurse into array item
                return { ...prop, items: updatedItems };
              }
            }
          }
          return prop;
        });
      }
    },
    [],
  );

  // Main handlers for the SchemaPropertyField callbacks
  const handlePropertyChange = useCallback(
    (path: string[], field: keyof SchemaProperty, value: any) => {
      onPropertiesChange((prev) =>
        updatePropertyByPath(prev as SchemaProperty[], path, field, value),
      );
    },
    [onPropertiesChange, updatePropertyByPath],
  );

  const handleAddProperty = useCallback(() => {
    onPropertiesChange((prev) => [
      ...prev,
      {
        id: nanoid(),
        name: 'newProperty',
        type: 'string',
        required: false,
        showOptions: false,
        showChildren: false,
      },
    ]);
  }, [onPropertiesChange]);

  const handleAddNestedProperty = useCallback(
    (path: string[], type: 'item' | 'property') => {
      onPropertiesChange((prev) => {
        const result = addNestedPropertyByPath(prev as SchemaProperty[], path, type);
        // filter out undefined if addNestedPropertyByPath returns undefined
        return result ? result.filter(Boolean) as SchemaProperty[] : prev;
      });
    },
    [onPropertiesChange, addNestedPropertyByPath],
  );

  const handleDeleteProperty = useCallback(
    (path: string[]) => {
      onPropertiesChange((prev) =>
        deletePropertyByPath(prev as SchemaProperty[], path),
      );
    },
    [onPropertiesChange, deletePropertyByPath],
  );

  // Handle creating schema in the backend
  const handleCreateSchema = useCallback(async () => {
    if (!$schema || Object.keys($schema).length === 0) {
      console.warn('No schema generated to create.');
      return;
    }

    setCreatingSchema(true);
    try {
      const payload: CreateSchemaPayload = {
        name: schemaTitle || 'Untitled Schema',
        schema: $schema,
      };
      const createdSchema = await schemaApi.createSchema(payload);
      console.log('Schema created successfully:', createdSchema);
      // Optionally, clear the current schema or show a success message
    } catch (error) {
      console.error('Failed to create schema:', error);
      // Optionally, show an error message
    } finally {
      setCreatingSchema(false);
    }
  }, [$schema, schemaTitle]);

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Manual Schema Definition:
      </Typography>

      {/* Top-level Schema Metadata Fields */}
      <TextField
        label="Schema ID ($id)"
        value={schemaId}
        onChange={(e) => onSchemaIdChange(e.target.value)}
        fullWidth
        margin="normal"
        size="small"
      />
      <TextField
        label="Meta-Schema URL ($schema)"
        value={metaSchemaUrl}
        onChange={(e) => onMetaSchemaUrlChange(e.target.value)}
        fullWidth
        margin="normal"
        size="small"
      />
      <TextField
        label="Schema Title"
        value={schemaTitle}
        onChange={(e) => onSchemaTitleChange(e.target.value)}
        fullWidth
        margin="normal"
        size="small"
      />
      <TextField
        label="Schema Description"
        value={schemaDescription}
        onChange={(e) => onSchemaDescriptionChange(e.target.value)}
        fullWidth
        multiline
        rows={2}
        margin="normal"
        size="small"
      />
      <TextField
        label="x-layout (Tailwind) (Top-level container)"
        value={schemaLayout}
        onChange={(e) => onSchemaLayoutChange(e.target.value)}
        fullWidth
        margin="normal"
        size="small"
        helperText="Tailwind classes for the top-level form container (e.g., grid grid-cols-12 gap-4)"
      />

      {properties.map((property) => (
        <SchemaPropertyField
          key={property.id}
          property={property}
          path={[property.id]}
          onPropertyChange={handlePropertyChange}
          onAddNestedProperty={handleAddNestedProperty}
          onDeleteProperty={handleDeleteProperty}
          nestingLevel={0}
        />
      ))}
      <Button
        startIcon={<AddIcon />}
        onClick={handleAddProperty}
        sx={{ mt: 2, textTransform: 'none' }}
        variant="contained"
        color="secondary"
      >
        Add Top-Level Property
      </Button>

      <Box mt={3} className="flex gap-2">
        <Button variant="contained" color="primary" onClick={onGenerateSchema}>
          Generate Schema from Manual Input
        </Button>
        {$schema && Object.keys($schema).length > 0 && (
          <Button
            variant="outlined"
            color="success"
            onClick={handleCreateSchema}
            disabled={creatingSchema}
            startIcon={
              creatingSchema ? (
                <CircularProgress size={20} color="inherit" />
              ) : null
            }
          >
            {creatingSchema ? 'Creating...' : 'Create Schema'}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default SchemaPropertiesEditor;
