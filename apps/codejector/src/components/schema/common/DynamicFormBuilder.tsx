import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  InputLabel,
  Grid,
  Button,
  IconButton,
  FormHelperText, // Import FormHelperText
} from '@mui/material';
import { JsonSchema, JsonSchemaProperty } from '@/types/schema'; // Import JsonSchemaProperty
import { nanoid } from 'nanoid';
import {
  Add as AddIcon,
  RemoveCircleOutline as RemoveIcon,
} from '@mui/icons-material';
//import { deepEqual } from '@/utils'; // Import deepEqual

interface DynamicFormBuilderProps {
  schema: JsonSchema;
  initialData?: Record<string, any>;
  onFormChange?: (data: Record<string, any>) => void;
  // For recursive calls for nested objects to manage indentation/styling
  level?: number;
}

const DynamicFormBuilder: React.FC<DynamicFormBuilderProps> = ({
  schema,
  initialData = {},
  onFormChange,
  level = 0,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);

  useEffect(() => {
    // Initialize formData with all properties from initialData first to preserve non-schema properties like '_id'
    const initial: Record<string, any> = { ...initialData };

    // Then apply defaults and recursively initialize for object/array types from schema
    if (schema.properties) {
      Object.keys(schema.properties).forEach((key) => {
        const prop = schema.properties![key];
        if (initial[key] === undefined) { // Only set default if not already in initialData
          if (prop.default !== undefined) {
            initial[key] = prop.default;
          } else if (prop.type === 'array' && prop.items?.type === 'object') {
            initial[key] = []; // Initialize array of objects as empty array
          } else if (prop.type === 'object') {
            initial[key] = {}; // Initialize object as empty object
          } else if (prop.type === 'string' && prop.default !== undefined) {
            // Handle default specifically for string types if they are not objects
            initial[key] = prop.default;
          }
        }
      });
    }
    
    // Only update formData if the new initial state is deeply different
    //if (!deepEqual(formData, initial)) {
      //setFormData(initial);
    //}
  }, [schema, initialData, formData]); // Add formData to dependencies to enable deep comparison against the latest state

  const handleChange = useCallback(
    (key: string, value: any, itemIndex?: number) => {
      setFormData((prev) => {
        const newFormData = { ...prev };

        if (itemIndex !== undefined) {
          // Handling array item change
          const currentArray = [...(newFormData[key] || [])];
          // For nested forms, `value` is the full formData of the child, including `_id` if preserved.
          currentArray[itemIndex] = value; // Replace the specific item with its updated value
          newFormData[key] = currentArray;
        } else {
          // Handling top-level or object property change
          newFormData[key] = value;
        }

        onFormChange?.(newFormData);
        return newFormData;
      });
    },
    [onFormChange],
  );

  const handleAddItemToArray = useCallback(
    (key: string, itemSchema: JsonSchema) => {
      setFormData((prev) => {
        const currentArray = [...(prev[key] || [])];
        const newItem: Record<string, any> = { _id: nanoid() }; // Add a unique id for keying in React
        if (itemSchema.properties) {
          Object.keys(itemSchema.properties).forEach((propKey) => {
            const prop = itemSchema.properties![propKey];
            if (newItem[propKey] === undefined) { // Only set default if not already in newItem
              if (prop.default !== undefined) {
                newItem[propKey] = prop.default;
              } else if (prop.type === 'array' && prop.items?.type === 'object') {
                newItem[propKey] = [];
              } else if (prop.type === 'object') {
                newItem[propKey] = {};
              } else if (prop.type === 'string' && prop.default !== undefined) {
                newItem[propKey] = prop.default;
              }
            }
          });
        }
        currentArray.push(newItem);
        const newFormData = { ...prev, [key]: currentArray };
        onFormChange?.(newFormData);
        return newFormData;
      });
    },
    [onFormChange],
  );

  const handleRemoveItemFromArray = useCallback(
    (key: string, indexToRemove: number) => {
      setFormData((prev) => {
        const currentArray = [...(prev[key] || [])];
        const newArray = currentArray.filter(
          (_, index) => index !== indexToRemove,
        );
        const newFormData = { ...prev, [key]: newArray };
        onFormChange?.(newFormData);
        return newFormData;
      });
    },
    [onFormChange],
  );

  if (
    !schema ||
    !schema.properties ||
    Object.keys(schema.properties).length === 0
  ) {
    return (
      <Typography
        variant="body2"
        color="textSecondary"
        sx={{ fontStyle: 'italic', ml: level * 2 }}
      >
        {level === 0
          ? 'No schema properties to display a form.'
          : 'No properties for this object.'}
      </Typography>
    );
  }

  const renderField = (key: string, prop: JsonSchemaProperty, fieldClassNames: string) => {
    const value = formData[key] ?? '';
    const label = prop.title || key;
    const description = prop.description;
    const isRequired = schema.required?.includes(key);

    // Define common props for Material UI components, excluding `helperText` initially
    const muiCommonProps = {
      fullWidth: true,
      margin: 'normal' as const,
      required: isRequired,
    };

    switch (prop.type) {
      case 'string':
        if (prop.format === 'date') {
          return (
            <TextField
              key={key}
              label={label}
              type="date"
              value={value}
              onChange={(e) => handleChange(key, e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText={description} // Explicitly add helperText for TextField
              {...muiCommonProps}
              className={fieldClassNames}
              sx={{ ml: level * 2 }}
            />
          );
        }
        if (prop.enum) {
          return (
            <FormControl key={key} {...muiCommonProps} className={fieldClassNames} sx={{ ml: level * 2 }}>
              <InputLabel id={`${key}-select-label`}>{label}</InputLabel>
              <Select
                labelId={`${key}-select-label`}
                id={`${key}-select`}
                value={value}
                label={label}
                onChange={(e) => handleChange(key, e.target.value)}
              >
                {prop.enum.map((option: string) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
              {description && <FormHelperText>{description}</FormHelperText>} {/* Use FormHelperText for description */}
            </FormControl>
          );
        }
        // Check for x-multiline custom property
        if (prop['x-multiline']) {
          return (
            <TextField
              key={key}
              label={label}
              value={value}
              onChange={(e) => handleChange(key, e.target.value)}
              helperText={description}
              multiline // Render as multiline textarea
              rows={4}   // Default number of rows
              {...muiCommonProps}
              className={fieldClassNames}
              sx={{ ml: level * 2 }}
            />
          );
        }
        return (
          <TextField
            key={key}
            label={label}
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            helperText={description} // Explicitly add helperText for TextField
            {...muiCommonProps}
            className={fieldClassNames}
            sx={{ ml: level * 2 }}
          />
        );
      case 'number':
      case 'integer':
        return (
          <TextField
            key={key}
            label={label}
            type="number"
            value={value}
            onChange={(e) => handleChange(key, Number(e.target.value))}
            helperText={description} // Explicitly add helperText for TextField
            {...muiCommonProps}
            className={fieldClassNames}
            sx={{ ml: level * 2 }}
          />
        );
      case 'boolean':
        return (
          <FormControlLabel
            key={key}
            control={
              <Checkbox
                checked={!!value} // Ensure boolean value
                onChange={(e) => handleChange(key, e.target.checked)}
                name={key}
              />
            }
            label={label}
            sx={{ mt: 2, mb: 1, ml: level * 2 }}
            className={fieldClassNames}
          />
        );
      case 'array':
        if (prop.items && typeof prop.items === 'object') {
          // Array of objects or complex types
          const currentArray = Array.isArray(formData[key])
            ? formData[key]
            : [];
          const itemSchema = prop.items;
          // Get x-layout for individual array items, if defined in the item schema
          const itemLayoutClasses = (itemSchema as any)['x-layout'] || '';

          return (
            <Box
              key={key}
              // Apply fieldClassNames to the container for the entire array field
              className={fieldClassNames}
              sx={{
                mt: 2,
                mb: 2,
                pl: 2,
                borderLeft: 1,
                borderColor: 'divider',
                ml: level * 2,
              }}
            >
              <Typography variant="subtitle2" gutterBottom className="mb-2">
                {label} (List)
              </Typography>
              {description && (
                <FormHelperText sx={{ ml: 0 }}>{description}</FormHelperText>
              )}
              {currentArray.map((item: Record<string, any>, index: number) => (
                <Box
                  key={item._id || index} // Use unique id if available, otherwise index
                  // Apply itemLayoutClasses to the individual item's container
                  className={itemLayoutClasses}
                  sx={{
                    mt: 1,
                    mb: 1,
                    p: 1.5,
                    border: '1px solid',
                    borderColor: 'grey.300',
                    borderRadius: 1,
                    position: 'relative',
                    bgcolor: 'background.paper',
                  }}
                >
                  <IconButton
                    aria-label="remove item"
                    onClick={() => handleRemoveItemFromArray(key, index)}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      zIndex: 1,
                    }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography
                    variant="caption"
                    sx={{ mb: 1, display: 'block' }}
                  >
                    Item {index + 1}
                  </Typography>
                  <DynamicFormBuilder
                    schema={itemSchema}
                    initialData={item}
                    onFormChange={(nestedData) =>
                      handleChange(key, nestedData, index)
                    }
                    level={level + 1}
                  />
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => handleAddItemToArray(key, itemSchema)}
                sx={{ mt: 2, textTransform: 'none' }}
                variant="outlined"              
                size="small"
              >
                Add {label} Item
              </Button>
            </Box>
          );
        } else {
          // Array of primitive types, handled as comma-separated string
          return (
            <TextField
              key={key}
              label={`${label} (comma-separated)`}
              value={Array.isArray(value) ? value.join(', ') : value}
              onChange={(e) =>
                handleChange(
                  key,
                  e.target.value
                    .split(',')
                    .map((s: string) => s.trim())
                    .filter((s: string) => s !== ''),
                )
              }
              helperText={description} // Explicitly add helperText for TextField
              {...muiCommonProps}
              className={fieldClassNames}
              sx={{ ml: level * 2 }}
            />
          );
        }
      case 'object':
        // The prop itself defines the schema for the nested object
        return (
          <Box
            key={key}
            // Apply fieldClassNames to the container for the entire object field
            className={fieldClassNames}
            sx={{
              mt: 2,
              mb: 2,
              pl: 2,
              borderLeft: 1,
              borderColor: 'divider',
              ml: level * 2,
            }}
          >
            <Typography variant="subtitle2" gutterBottom className="mb-2">
              {label}
            </Typography>
            {description && (
              <FormHelperText sx={{ ml: 0 }}>{description}</FormHelperText>
            )}
            <DynamicFormBuilder
              schema={prop as JsonSchema}
              initialData={formData[key] || {}}
              onFormChange={(nestedData) => handleChange(key, nestedData)}
              level={level + 1}
            />
          </Box>
        );
      default:
        return (
          <Typography
            key={key}
            variant="body2"
            color="error"
            className={fieldClassNames}
            sx={{ ml: level * 2 }}
          >
            Unsupported type for {label}: {prop.type}
          </Typography>
        );
    }
  };

  // Determine the root layout classes, defaulting if x-layout is not present
  const rootLayoutClasses = (schema as any)['x-layout'] || 'grid grid-cols-12 gap-4';

  // Prepare properties for sorting by x-order
  const sortedProperties = schema.properties
    ? Object.entries(schema.properties)
        .map(([key, prop]) => ({
          key,
          prop,
          order: (prop as any)['x-order'] ?? Infinity, // Assign Infinity if x-order is missing
          classNames: (prop as any)['x-classNames'] ?? '', // Capture x-classNames
        }))
        .sort((a, b) => a.order - b.order)
    : [];

  return (
    <Box className={rootLayoutClasses}>
      {level === 0 && schema.title && (
        <Typography variant="h6" gutterBottom className="col-span-12">
          {schema.title}
        </Typography>
      )}
      {schema.description && level === 0 && (
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ mb: 2 }}
          className="col-span-12"
        >
          {schema.description}
        </Typography>
      )}

      {sortedProperties.map(({ key, prop, classNames }) => (
        <React.Fragment key={key}>
          {renderField(key, prop, classNames)}
        </React.Fragment>
      ))}
    </Box>
  );
};

export default DynamicFormBuilder;
