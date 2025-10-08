# Dynamic Form Builder for Developers

The `src/components/schema/common/DynamicFormBuilder.tsx` component is a powerful utility that dynamically generates Material UI forms based on a provided JSON Schema. This allows for flexible and configurable user input forms without writing custom React components for each data structure.

## How it Works

The `DynamicFormBuilder` component takes a `JsonSchema` object as a prop and recursively renders appropriate Material UI input components (e.g., `TextField`, `Checkbox`, `Select`, nested `DynamicFormBuilder` instances) based on the schema's property types and associated metadata.

It supports:
-   **Standard JSON Schema Keywords**: `type`, `title`, `description`, `required`, `enum`, `format`, `minimum`, `maximum`, `minLength`, `maxLength`, `pattern`, `default`.
-   **Custom UI Hinting `x-` Properties**: `x-order`, `x-classNames`, `x-layout`, `x-multiline` for fine-grained control over UI rendering and layout.

## Usage

```typescript jsx
import React from 'react';
import { Box } from '@mui/material';
import DynamicFormBuilder from '@/components/schema/common/DynamicFormBuilder';
import { JsonSchema } from '@/types/schema';

const sampleSchema: JsonSchema = {
  $id: 'https://example.com/product.schema.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Product Information',
  description: 'Schema for defining product details with UI hints.',
  type: 'object',
  'x-layout': 'grid grid-cols-12 gap-4', // Top-level layout
  properties: {
    productName: {
      type: 'string',
      title: 'Product Name',
      description: 'The name of the product.',
      minLength: 3,
      maxLength: 100,
      default: 'New Product',
      'x-order': 0,
      'x-classNames': 'col-span-12 md:col-span-6',
      required: true,
    },
    price: {
      type: 'number',
      title: 'Price (USD)',
      minimum: 0,
      default: 9.99,
      'x-order': 1,
      'x-classNames': 'col-span-12 md:col-span-3',
      required: true,
    },
    inStock: {
      type: 'boolean',
      title: 'In Stock',
      default: true,
      'x-order': 2,
      'x-classNames': 'col-span-12 md:col-span-3',
    },
    description: {
      type: 'string',
      title: 'Product Description',
      'x-multiline': true,
      'x-order': 3,
      'x-classNames': 'col-span-12',
    },
    category: {
      type: 'string',
      title: 'Category',
      enum: ['Electronics', 'Books', 'Clothing', 'Home'],
      default: 'Electronics',
      'x-order': 4,
      'x-classNames': 'col-span-12 md:col-span-6',
    },
    tags: {
      type: 'array',
      title: 'Tags (comma-separated)',
      description: 'Keywords for the product.',
      items: { type: 'string' },
      default: ['new', 'hot'],
      'x-order': 5,
      'x-classNames': 'col-span-12 md:col-span-6',
    },
    specifications: {
      type: 'array',
      title: 'Specifications',
      description: 'Detailed product specifications.',
      'x-order': 6,
      'x-classNames': 'col-span-12',
      items: {
        type: 'object',
        title: 'Specification Item',
        'x-layout': 'grid grid-cols-12 gap-2', // Layout for individual array items
        properties: {
          name: {
            type: 'string',
            title: 'Name',
            'x-classNames': 'col-span-6',
            required: true,
          },
          value: {
            type: 'string',
            title: 'Value',
            'x-classNames': 'col-span-6',
            required: true,
          },
        },
        required: ['name', 'value'],
      },
    },
    manufacturer: {
      type: 'object',
      title: 'Manufacturer Details',
      'x-order': 7,
      'x-classNames': 'col-span-12',
      'x-layout': 'grid grid-cols-12 gap-4', // Layout for nested object properties
      properties: {
        name: {
          type: 'string',
          title: 'Manufacturer Name',
          'x-classNames': 'col-span-12 md:col-span-6',
        },
        country: {
          type: 'string',
          title: 'Country of Origin',
          'x-classNames': 'col-span-12 md:col-span-6',
        },
      },
      required: ['name'],
    },
  },
  required: ['productName', 'price'],
};

const ProductForm: React.FC = () => {
  const [formData, setFormData] = React.useState({});

  const handleFormChange = (data: Record<string, any>) => {
    console.log('Form data changed:', data);
    setFormData(data);
  };

  return (
    <Box sx={{ p: 4 }}>
      <DynamicFormBuilder schema={sampleSchema} onFormChange={handleFormChange} />
      <Box sx={{ mt: 4, bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
        <pre>{JSON.stringify(formData, null, 2)}</pre>
      </Box>
    </Box>
  );
};

export default ProductForm;
```

## Supported JSON Schema Types and Corresponding UI

The `DynamicFormBuilder` maps JSON Schema types to Material UI components as follows:

| JSON Schema Type | Material UI Component | Notes                                                                                                                                                                                                                                                                      |
| :--------------- | :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `string`         | `TextField`           | Default. If `format: 'date'`, renders a `type="date"` input. If `enum` is present, renders a `Select` dropdown. If `x-multiline: true`, renders a multiline `TextField` (textarea).                                                                                        |
| `number`         | `TextField`           | `type="number"`. Supports `minimum` and `maximum` validation (though validation is client-side only and not strictly enforced by MUI, it's a hint).                                                                                                                     |
| `integer`        | `TextField`           | `type="number"`. Similar to `number`.                                                                                                                                                                                                                                      |
| `boolean`        | `Checkbox`            | Renders a `FormControlLabel` with a `Checkbox`.                                                                                                                                                                                                                            |
| `array`          | Varies                |
|                  | Array of Objects      | Renders a section with "Add Item" and "Remove Item" buttons. Each item is rendered using a nested `DynamicFormBuilder` instance based on the `items` schema. Items are assigned a unique `_id` for React keying.                                                          |
|                  | Array of Primitives   | Renders a single `TextField` where values are entered as a comma-separated string (e.g., `tag1, tag2`).                                                                                                                                                                   |
| `object`         | Nested `Box`          | Renders a nested section. Its `properties` are rendered using another `DynamicFormBuilder` instance, recursively. The `object` type itself can have `x-layout` to control its children's arrangement.                                                                     |
| `null`           | N/A                   | Currently, `null` types are not rendered as input fields, as they represent the absence of a value rather than an input. A warning message might appear if this is the only property.                                                                                       |
| Other types      | `Typography` (error)  | Displays an error message for unsupported types.                                                                                                                                                                                                                           |

## Custom UI Hinting `x-` Properties

The `DynamicFormBuilder` significantly leverages custom `x-` properties within the `JsonSchema` to control the visual presentation and layout of the generated form. These are defined in `SchemaPropertyTypes.ts` and managed in `SchemaPropertiesEditor.tsx`.

-   **`x-order` (number)**:
    -   **Purpose**: Defines the display order of properties within their parent `object` or the top-level form. Properties with lower `x-order` values will appear before those with higher values. Properties without `x-order` default to `Infinity` and appear last.
    -   **Application**: Applies to properties within an `object` and the `items` schema of an `array`.
    -   **Example**: `{"productName": {"type": "string", "x-order": 0}, "description": {"type": "string", "x-order": 1}}`

-   **`x-classNames` (string)**:
    -   **Purpose**: Applies Tailwind CSS classes directly to the *Material UI component wrapper* for a specific form field. This is typically used to control width or other field-specific styling.
    -   **Application**: Applies to individual `properties` within an `object` or the `items` schema of an `array` (which becomes the container for the item's form).
    -   **Example**: `{"productName": {"type": "string", "x-classNames": "col-span-12 md:col-span-6"}}` will make the `productName` field span 6 columns on medium screens and up within its parent's grid layout.

-   **`x-layout` (string)**:
    -   **Purpose**: Defines the Tailwind CSS grid or flex layout for the *children* of an `object` or the *individual items' containers* within an `array`.
    -   **Application**:
        -   **Top-level**: If applied to the root `JsonSchema` object (e.g., `schema['x-layout']`), it controls the layout of all top-level properties.
        -   **Nested `object`**: If applied to an `object` property (e.g., `manufacturer['x-layout']`), it controls the layout of `manufacturer`'s properties.
        -   **`array` items**: If applied to the `items` schema of an `array` (e.g., `specifications.items['x-layout']`), it controls the layout of properties within each individual item in the array.
    -   **Example**:
        -   Top-level: `"x-layout": "grid grid-cols-12 gap-4"`
        -   Nested object: `"manufacturer": {"type": "object", "x-layout": "grid grid-cols-12 gap-4", "properties": {...}}`
        -   Array items: `"items": {"type": "object", "x-layout": "grid grid-cols-12 gap-2", "properties": {...}}`

-   **`x-multiline` (boolean)**:
    -   **Purpose**: For `string` type properties, if set to `true`, the `DynamicFormBuilder` will render a Material UI `TextField` with `multiline` and `rows={4}` props, creating a textarea.
    -   **Application**: Applies to individual `string` properties.
    -   **Example**: `{"description": {"type": "string", "x-multiline": true}}`

## Data Flow

-   **`initialData` Prop**: Allows pre-populating the form with existing data. This is crucial for editing existing records. It also handles preserving non-schema properties (like an `_id` for database records) if they are present in `initialData`.
-   **`onFormChange` Callback**: This callback is triggered whenever a field in the form changes. It provides the latest form data (`Record<string, any>`) as its argument, allowing parent components to react to or persist the user's input.
-   **Internal State**: `DynamicFormBuilder` maintains its own `formData` state. When `initialData` or `schema` props change, the internal `formData` is re-initialized to reflect these changes while preserving user input where possible.

By effectively utilizing these features, developers can create highly customizable and functional forms dynamically, reducing boilerplate and increasing maintainability.
