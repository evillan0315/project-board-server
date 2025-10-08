/**
 * @module SchemaPropertyField
 * @description Renders a single schema property field with its name, type, required status, and advanced options.
 * Supports nested properties for 'array' and 'object' types.
 */

import React from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormGroup,
  FormControlLabel,
  IconButton,
  useTheme,
  Typography,
  Paper,
  Button,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
} from '@mui/icons-material';
import { SchemaProperty } from './SchemaPropertyTypes';

/**
 * Props for the SchemaPropertyField component.
 */
interface SchemaPropertyFieldProps {
  property: SchemaProperty;
  path: string[]; // Path to this property, e.g., ['id1'], ['id1', 'id2']
  onPropertyChange: (
    path: string[],
    field: keyof SchemaProperty,
    value: any,
  ) => void;
  onAddNestedProperty: (path: string[], type: 'item' | 'property') => void;
  onDeleteProperty: (path: string[]) => void; // Path to the property to delete
  nestingLevel: number;
}

// Styles for consistent visual appearance
const sxNestedSection = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  mt: 2,
  borderLeft: '2px solid',
  pl: 2,
};

const sxAddButton = {
  mt: 1,
  textTransform: 'none' as const,
};

const SchemaPropertyField: React.FC<SchemaPropertyFieldProps> = ({
  property,
  path,
  onPropertyChange,
  onAddNestedProperty,
  onDeleteProperty,
  nestingLevel,
}) => {
  const theme = useTheme();
  const indent = nestingLevel * 20; // Indent based on nesting level

  const handleFieldChange = (field: keyof SchemaProperty, value: any) => {
    onPropertyChange(path, field, value);
  };

  const handleEnumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enumValues = e.target.value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    handleFieldChange('enum', enumValues);
  };

  const handleToggleOptions = () => {
    handleFieldChange('showOptions', !property.showOptions);
  };

  const handleToggleChildren = () => {
    handleFieldChange('showChildren', !property.showChildren);
  };

  const handleDelete = () => {
    onDeleteProperty(path);
  };

  const handleAddNested = (type: 'item' | 'property') => {
    onAddNestedProperty(path, type);
  };

  const sxContainer = {
    padding: 2,
    marginBottom: 2,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 1,
    ml: `${indent}px`, // Apply indentation
    bgcolor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.03)', // Subtle background for nesting
  };

  return (
    <Paper sx={sxContainer}>
      <Box display="flex" alignItems="center" gap={2} mb={1}>
        <TextField
          label="Property Name"
          value={property.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          size="small"
          sx={{ flexGrow: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id={`type-label-${property.id}`}>Type</InputLabel>
          <Select
            labelId={`type-label-${property.id}`}
            value={property.type}
            label="Type"
            onChange={(e) =>
              handleFieldChange(
                'type',
                e.target.value as SchemaProperty['type'],
              )
            }
          >
            <MenuItem value="string">String</MenuItem>
            <MenuItem value="number">Number</MenuItem>
            <MenuItem value="boolean">Boolean</MenuItem>
            <MenuItem value="array">Array</MenuItem>
            <MenuItem value="object">Object</MenuItem>
            <MenuItem value="null">Null</MenuItem>
          </Select>
        </FormControl>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={property.required}
                onChange={(e) =>
                  handleFieldChange('required', e.target.checked)
                }
                size="small"
              />
            }
            label="Required"
          />
        </FormGroup>

        {/* Toggle Advanced Options */}
        <Tooltip
          title={
            property.showOptions
              ? 'Hide Advanced Options'
              : 'Show Advanced Options'
          }
        >
          <IconButton onClick={handleToggleOptions} size="small">
            {property.showOptions ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </IconButton>
        </Tooltip>

        {/* Toggle Children (for object/array) */}
        {(property.type === 'array' || property.type === 'object') && (
          <Tooltip
            title={
              property.showChildren
                ? 'Hide Nested Fields'
                : 'Show Nested Fields'
            }
          >
            <IconButton onClick={handleToggleChildren} size="small">
              {property.showChildren ? (
                <KeyboardArrowUpIcon />
              ) : (
                <KeyboardArrowDownIcon />
              )}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete Property */}
        <Tooltip title="Delete Property">
          <IconButton aria-label="delete" onClick={handleDelete} size="small">
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Advanced Options */}
      <Collapse in={property.showOptions} timeout="auto" unmountOnExit>
        <Box sx={{ ...sxNestedSection, borderColor: theme.palette.divider }}>
          <TextField
            label="Description"
            value={property.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="Default Value"
            // Value can be of any type, so display it as a string
            value={property.default !== undefined ? String(property.default) : ''}
            onChange={(e) => handleFieldChange('default', e.target.value)}
            size="small"
            fullWidth
            helperText="Default value for this property. Type inference is applied based on schema type."
          />
          <TextField
            label="Format"
            value={property.format || ''}
            onChange={(e) => handleFieldChange('format', e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="Enum (comma separated)"
            value={(property.enum || []).join(', ')}
            onChange={handleEnumChange}
            size="small"
            fullWidth
          />
          <TextField
            label="Minimum"
            type="number"
            value={property.minimum !== undefined ? property.minimum : ''}
            onChange={(e) =>
              handleFieldChange(
                'minimum',
                e.target.value === '' ? undefined : Number(e.target.value),
              )
            }
            size="small"
            fullWidth
          />
          <TextField
            label="Maximum"
            type="number"
            value={property.maximum !== undefined ? property.maximum : ''}
            onChange={(e) =>
              handleFieldChange(
                'maximum',
                e.target.value === '' ? undefined : Number(e.target.value),
              )
            }
            size="small"
            fullWidth
          />
          {property.type === 'string' && (
            <> {/* Use a fragment to group string-specific fields */}
              <TextField
                label="Min Length"
                type="number"
                value={property.minLength !== undefined ? property.minLength : ''}
                onChange={(e) =>
                  handleFieldChange(
                    'minLength',
                    e.target.value === '' ? undefined : Number(e.target.value),
                  )
                }
                size="small"
                fullWidth
              />
              <TextField
                label="Max Length"
                type="number"
                value={property.maxLength !== undefined ? property.maxLength : ''}
                onChange={(e) =>
                  handleFieldChange(
                    'maxLength',
                    e.target.value === '' ? undefined : Number(e.target.value),
                  )
                }
                size="small"
                fullWidth
              />
              <TextField
                label="Pattern (RegEx)"
                value={property.pattern || ''}
                onChange={(e) => handleFieldChange('pattern', e.target.value)}
                size="small"
                fullWidth
                helperText="Regular expression for string validation"
              />
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!property.xMultiline}
                      onChange={(e) =>
                        handleFieldChange('xMultiline', e.target.checked)
                      }
                      size="small"
                    />
                  }
                  label="Render as Multiline Textarea"
                  sx={{ mt: 1 }}
                />
              </FormGroup>
            </>
          )}

          <TextField
            label="x-order (for UI sorting)"
            type="number"
            value={property.xOrder !== undefined ? property.xOrder : ''}
            onChange={(e) =>
              handleFieldChange(
                'xOrder',
                e.target.value === '' ? undefined : Number(e.target.value),
              )
            }
            size="small"
            fullWidth
            helperText="Order hint for UI display (e.g., in DynamicFormBuilder). Lower numbers appear first."
          />
          <TextField
            label="x-classNames (Tailwind)"
            value={property.xClassNames || ''}
            onChange={(e) => handleFieldChange('xClassNames', e.target.value)}
            size="small"
            fullWidth
            helperText="Tailwind classes for UI styling of this specific field (e.g., col-span-6)."
          />
          <TextField
            label="x-layout (Tailwind) (for object/array children)"
            value={property.xLayout || ''}
            onChange={(e) => handleFieldChange('xLayout', e.target.value)}
            size="small"
            fullWidth
            helperText="Tailwind classes for layout of immediate children (e.g., grid grid-cols-2 gap-4). Only applies to 'object' or 'array' types."
          />
        </Box>
      </Collapse>

      {/* Nested Properties (for Object and Array types) */}
      <Collapse in={property.showChildren} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 2 }}>
          {property.type === 'object' && (
            <>
              <Typography
                variant="body2"
                sx={{ ml: `${indent + 2}px`, mb: 1, fontWeight: 'bold' }}
              >
                Object Properties:
              </Typography>
              {property.properties?.map((nestedProperty) => (
                <SchemaPropertyField
                  key={nestedProperty.id}
                  property={nestedProperty}
                  path={path.concat([nestedProperty.id])} // Corrected path to use ID
                  onPropertyChange={onPropertyChange}
                  onAddNestedProperty={onAddNestedProperty}
                  onDeleteProperty={onDeleteProperty}
                  nestingLevel={nestingLevel + 1}
                />
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => handleAddNested('property')}
                sx={{ ...sxAddButton, ml: `${indent + 2}px` }}
                variant="outlined"
                size="small"
              >
                Add Object Property
              </Button>
            </>
          )}

          {property.type === 'array' && (
            <>
              <Typography
                variant="body2"
                sx={{ ml: `${indent + 2}px`, mb: 1, fontWeight: 'bold' }}
              >
                Array Items Schema:
              </Typography>
              {property.items ? (
                <SchemaPropertyField
                  key={property.items.id}
                  property={property.items}
                  path={path.concat([property.items.id])} // Corrected path to use ID of items schema
                  onPropertyChange={onPropertyChange}
                  onAddNestedProperty={onAddNestedProperty}
                  onDeleteProperty={onDeleteProperty}
                  nestingLevel={nestingLevel + 1}
                />
              ) : (
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => handleAddNested('item')}
                  sx={{ ...sxAddButton, ml: `${indent + 2}px` }}
                  variant="outlined"
                  size="small"
                >
                  Define Array Item Schema
                </Button>
              )}
            </>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default SchemaPropertyField;
