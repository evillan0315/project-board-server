import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Switch,
  FormGroup,
  FormControlLabel,
  Typography,
  CircularProgress,
} from '@mui/material';
import { generateSchema } from '@/api/llm';
import { useStore } from '@nanostores/react';
import { schemaStore } from '@/stores/schemaStore';
import { nanoid } from 'nanoid';
import { SchemaProperty } from './common/SchemaPropertyTypes';
import SchemaPropertiesEditor from './common/SchemaPropertiesEditor';
import SchemaInstructionGenerator from './common/SchemaInstructionGenerator';
import GeneratedSchemaViewer from './common/GeneratedSchemaViewer';

const AiSchemaGenerator: React.FC = () => {
  const [properties, setProperties] = useState<SchemaProperty[]>([
    {
      id: nanoid(),
      name: 'newProperty',
      type: 'string',
      required: true,
      showOptions: false,
      showChildren: false,
    },
  ]);
  const [useInstruction, setUseInstruction] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [applyInstruction, setApplyInstruction] = useState('');
  const [loading, setLoading] = useState(false);

  // State for top-level schema metadata
  const [schemaId, setSchemaId] = useState(''); // Corresponds to JSON Schema $id
  const [metaSchemaUrl, setMetaSchemaUrl] = useState(
    'http://json-schema.org/draft-07/schema#',
  ); // Corresponds to JSON Schema $schema
  const [schemaTitle, setSchemaTitle] = useState('');
  const [schemaDescription, setSchemaDescription] = useState('');
  const [schemaLayout, setSchemaLayout] = useState(''); // Corresponds to x-layout at the root

  const $schema = useStore(schemaStore);

  // Helper function to convert JSON schema to SchemaProperty structure recursively
  const convertJsonSchemaToSchemaPropertyRecursive = useCallback(
    (name: string, details: any, requiredFields: string[] = []): SchemaProperty => {
      const propertyId = nanoid();
      const baseProperty: SchemaProperty = {
        id: propertyId,
        name: name,
        type: details.type || 'string',
        required: requiredFields.includes(name),
        description: details.description,
        format: details.format,
        enum: details.enum,
        minimum: details.minimum,
        maximum: details.maximum,
        minLength: details.minLength,
        maxLength: details.maxLength,
        default: details.default, // Extract default value
        pattern: details.pattern, // Extract pattern
        showOptions: false, // Start collapsed
        showChildren: false, // Start collapsed
        xOrder: details['x-order'],
        xClassNames: details['x-classNames'],
        xLayout: details['x-layout'],
        xMultiline: details['x-multiline'], // Extract x-multiline
      };

      // Handle array items
      if (baseProperty.type === 'array' && details.items) {
        const itemRequiredFields = details.items.required || [];
        baseProperty.items = convertJsonSchemaToSchemaPropertyRecursive(
          'items-schema', // A generic name for the item's schema itself
          details.items,
          itemRequiredFields,
        );
      }

      // Handle object properties
      if (baseProperty.type === 'object' && details.properties) {
        const objectRequiredFields = details.required || [];
        baseProperty.properties = Object.entries(details.properties).map(
          ([propName, propDetails]: [string, any]) =>
            convertJsonSchemaToSchemaPropertyRecursive(
              propName,
              propDetails,
              objectRequiredFields,
            ),
        );
      }

      return baseProperty;
    },
    [],
  );

  // Function to parse JSON schema and update properties and top-level metadata
  const parseSchema = useCallback(
    (schema: any) => {
      // Update top-level schema metadata
      setSchemaId(schema.$id || ''); // Extract $id
      setMetaSchemaUrl(
        schema.$schema || 'http://json-schema.org/draft-07/schema#',
      ); // Extract $schema, set default if missing
      setSchemaTitle(schema.title || '');
      setSchemaDescription(schema.description || '');
      setSchemaLayout(schema['x-layout'] || ''); // Extract x-layout

      if (typeof schema === 'object' && schema !== null && schema.properties) {
        const newProperties: SchemaProperty[] = Object.entries(
          schema.properties,
        ).map(([name, details]: [string, any]) =>
          convertJsonSchemaToSchemaPropertyRecursive(
            name,
            details,
            schema.required || [],
          ),
        );
        setProperties(newProperties);
      } else {
        console.error(
          'Invalid schema format: properties field missing or schema is not an object.',
        );
        setProperties([]); // Reset properties on invalid schema
      }
    },
    [convertJsonSchemaToSchemaPropertyRecursive],
  );

  // Use useEffect to call parseSchema whenever $schema changes
  useEffect(() => {
    if ($schema && Object.keys($schema).length > 0) {
      // Check if $schema is not empty
      parseSchema($schema);
    } else {
      // Reset properties and metadata if schema is empty/reset
      setProperties([
        {
          id: nanoid(),
          name: 'newProperty',
          type: 'string',
          required: true,
          showOptions: false,
          showChildren: false,
        },
      ]);
      setSchemaId(''); // Reset schemaId
      setMetaSchemaUrl('http://json-schema.org/draft-07/schema#'); // Reset metaSchemaUrl to default
      setSchemaTitle('');
      setSchemaDescription('');
      setSchemaLayout(''); // Reset schemaLayout
    }
  }, [$schema, parseSchema]);

  // Helper function to convert SchemaProperty structure to JSON schema recursively
  const convertSchemaPropertyToJsonSchemaRecursive = useCallback(
    (property: SchemaProperty): any => {
      const jsonSchema: any = { type: property.type };

      if (property.description) jsonSchema.description = property.description;
      if (property.format) jsonSchema.format = property.format;
      if (property.enum && property.enum.length > 0)
        jsonSchema.enum = property.enum;
      if (property.minimum !== undefined) jsonSchema.minimum = property.minimum;
      if (property.maximum !== undefined) jsonSchema.maximum = property.maximum;
      if (property.minLength !== undefined)
        jsonSchema.minLength = property.minLength;
      if (property.maxLength !== undefined)
        jsonSchema.maxLength = property.maxLength;
      if (property.default !== undefined) jsonSchema.default = property.default; // Add default
      if (property.pattern) jsonSchema.pattern = property.pattern; // Add pattern

      // Add custom 'x-' properties if they exist
      if (property.xOrder !== undefined) jsonSchema['x-order'] = property.xOrder;
      if (property.xClassNames) jsonSchema['x-classNames'] = property.xClassNames;
      if (property.xLayout) jsonSchema['x-layout'] = property.xLayout;
      if (property.xMultiline !== undefined) jsonSchema['x-multiline'] = property.xMultiline; // Add x-multiline

      if (property.type === 'array' && property.items) {
        // For arrays, the 'items' field directly holds the schema for a single array element
        const itemSchema = convertSchemaPropertyToJsonSchemaRecursive(
          property.items,
        );

        // If the array items are objects, their properties and required fields are part of 'items'
        if (property.items.type === 'object' && property.items.properties) {
          const nestedObjectProps: { [key: string]: any } = {};
          const nestedObjectRequired: string[] = [];
          property.items.properties.forEach((nestedProp) => {
            nestedObjectProps[nestedProp.name] =
              convertSchemaPropertyToJsonSchemaRecursive(nestedProp);
            if (nestedProp.required) nestedObjectRequired.push(nestedProp.name);
          });
          itemSchema.properties = nestedObjectProps;
          if (nestedObjectRequired.length > 0) {
            itemSchema.required = nestedObjectRequired;
          }
        }
        jsonSchema.items = itemSchema;
      }

      if (property.type === 'object' && property.properties) {
        const nestedProps: { [key: string]: any } = {};
        const nestedRequired: string[] = [];
        property.properties.forEach((nestedProp) => {
          nestedProps[nestedProp.name] =
            convertSchemaPropertyToJsonSchemaRecursive(nestedProp);
          if (nestedProp.required) nestedRequired.push(nestedProp.name);
        });
        jsonSchema.properties = nestedProps;
        if (nestedRequired.length > 0) {
          jsonSchema.required = nestedRequired;
        }
      }

      return jsonSchema;
    },
    [],
  );

  // Function to generate schema from properties defined in the UI
  const generateSchemaFromProperties = useCallback(() => {
    const rootProperties: { [key: string]: any } = {};
    const rootRequired: string[] = [];

    properties.forEach((prop) => {
      rootProperties[prop.name] =
        convertSchemaPropertyToJsonSchemaRecursive(prop);
      if (prop.required) rootRequired.push(prop.name);
    });

    const schema: any = {
      type: 'object',
      properties: rootProperties,
    };

    if (rootRequired.length > 0) {
      schema.required = rootRequired;
    }
    if (schemaId) {
      // Use schemaId for $id
      schema.$id = schemaId;
    }
    if (metaSchemaUrl) {
      // Add metaSchemaUrl for $schema
      schema.$schema = metaSchemaUrl;
    }
    if (schemaTitle) {
      schema.title = schemaTitle;
    }
    if (schemaDescription) {
      schema.description = schemaDescription;
    }
    if (schemaLayout) {
      // Add top-level x-layout
      schema['x-layout'] = schemaLayout;
    }

    schemaStore.set(schema);
  }, [
    properties,
    schemaId,
    metaSchemaUrl,
    schemaTitle,
    schemaDescription,
    schemaLayout,
    convertSchemaPropertyToJsonSchemaRecursive,
  ]);

  // Function to generate schema from instruction using AI
  const generateSchemaFromInstruction = useCallback(async () => {
    setLoading(true);
    try {
      const aiResponse = await generateSchema(
        `Generate a JSON schema based on the following instruction: ${instruction}`,
      );

      if (aiResponse) {
        try {
          const parsedSchema = JSON.parse(aiResponse);
          schemaStore.set(parsedSchema);
        } catch (error) {
          console.error('Failed to parse generated schema:', error);
          schemaStore.set('Error: Invalid JSON generated.');
        }
      }
    } catch (error) {
      console.error('Error generating schema from instruction:', error);
      schemaStore.set('Error: Failed to generate schema.');
    } finally {
      setLoading(false);
    }
  }, [instruction]);

  // Handle applying generated schema to a new instruction prompt
  const handleApplySchemaToInstruction = useCallback(() => {
    if ($schema) {
      setInstruction(applyInstruction + JSON.stringify($schema, null, 2));
    }
  }, [applyInstruction, $schema]);

  return (
    <Box sx={{ padding: 3, width: '100%' }}>
      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              checked={useInstruction}
              onChange={(e) => setUseInstruction(e.target.checked)}
            />
          }
          label='Generate Schema from Instruction'
        />
      </FormGroup>

      {useInstruction ? (
        <SchemaInstructionGenerator
          instruction={instruction}
          onInstructionChange={setInstruction}
          onGenerateSchemaFromInstruction={generateSchemaFromInstruction}
          loading={loading}
          applyInstruction={applyInstruction}
          onApplyInstructionChange={setApplyInstruction}
          onApplySchemaToInstruction={handleApplySchemaToInstruction}
        />
      ) : (
        <SchemaPropertiesEditor
          properties={properties}
          onPropertiesChange={setProperties}
          onGenerateSchema={generateSchemaFromProperties}
          schemaId={schemaId}
          onSchemaIdChange={setSchemaId}
          metaSchemaUrl={metaSchemaUrl}
          onMetaSchemaUrlChange={setMetaSchemaUrl}
          schemaTitle={schemaTitle}
          onSchemaTitleChange={setSchemaTitle}
          schemaDescription={schemaDescription}
          onSchemaDescriptionChange={setSchemaDescription}
          schemaLayout={schemaLayout} // Pass top-level x-layout
          onSchemaLayoutChange={setSchemaLayout} // Pass top-level x-layout handler
        />
      )}

      <GeneratedSchemaViewer />
    </Box>
  );
};

export default AiSchemaGenerator;
