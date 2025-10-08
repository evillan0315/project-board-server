/**
 * @module SchemaPropertyFieldHelperTexts
 * @description Centralized helper text messages for the SchemaPropertyField component.
 */

export const SchemaPropertyFieldHelperTexts = {
  defaultValue: 'Default value for this property. Type inference is applied based on schema type.',
  format: 'e.g., date, date-time, email, uri, uuid',
  enum: 'Comma-separated list of allowed values (e.g., option1, option2)',
  minimum: 'Minimum allowed numeric value',
  maximum: 'Maximum allowed numeric value',
  minLength: 'Minimum allowed string length',
  maxLength: 'Maximum allowed string length',
  pattern: 'Regular expression for string validation',
  order: 'Order hint for UI display (e.g., in DynamicFormBuilder). Lower numbers appear first.',
  classNames: 'Tailwind classes for UI styling of this specific field (e.g., col-span-6).',
  layout: "Tailwind classes for layout of immediate children (e.g., grid grid-cols-2 gap-4). Only applies to 'object' or 'array' types."
};
