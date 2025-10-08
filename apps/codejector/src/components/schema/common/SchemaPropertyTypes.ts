/**
 * @module SchemaPropertyTypes
 * @description Defines the interface for a SchemaProperty, which represents a single property within a JSON schema.
 */

/**
 * Interface for a SchemaProperty to support nested structures in the UI.
 * Each property can have various JSON schema attributes and UI-specific flags.
 */
export interface SchemaProperty {
  id: string; // Unique ID for React keying and manipulation
  name: string; // Property name
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null';
  required: boolean;
  description?: string;
  format?: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  default?: any; // Default value for the property (can be any type)
  pattern?: string; // Regex pattern for string validation
  items?: SchemaProperty; // For array type, defines the schema for elements within the array (a single SchemaProperty)
  properties?: SchemaProperty[]; // For object type, defines the properties of the object (an array of SchemaProperty)
  showOptions?: boolean; // Controls visibility of advanced options for THIS property
  showChildren?: boolean; // Controls visibility of nested properties (for array/object types)
  xOrder?: number; // Custom property for UI ordering
  xClassNames?: string; // Custom property for UI CSS classes (supports Tailwind classes)
  xLayout?: string; // Custom property for UI layout of children (supports Tailwind grid/flex classes)
  xMultiline?: boolean; // Custom property to render string as a multiline textarea
}
