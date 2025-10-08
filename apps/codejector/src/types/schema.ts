/**
 * Interface representing a Schema record.
 */
export interface Schema {
  id: string;
  name: string;
  schema: object;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
}

/**
 * Payload for creating a new schema.
 */
export interface CreateSchemaPayload {
  name: string;
  schema: object;
}

/**
 * Payload for updating an existing schema.
 */
export interface UpdateSchemaPayload {
  name?: string;
  schema?: object;
}

/**
 * Query parameters for paginated schema retrieval.
 */
export interface PaginationSchemaQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  schema?: object; // Note: Filtering by object directly might not be supported by NestJS query parsing depending on implementation.
}

/**
 * Result structure for paginated schema retrieval.
 */
export interface PaginationSchemaResult {
  items: Schema[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Define a type for a JSON Schema property, allowing custom 'x-' properties
export interface JsonSchemaProperty {
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null';
  title?: string;
  description?: string;
  format?: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  default?: any;
  pattern?: string;
  items?: JsonSchema; // Can be a full schema object or a reference
  properties?: { [key: string]: JsonSchemaProperty };
  required?: string[]; // For object properties, defines required fields within that object
  // Allow for arbitrary 'x-' prefixed custom properties
  [key: `x-${string}`]: any; // Allows any custom property starting with 'x-'
}

// Define the main JSON Schema interface
export interface JsonSchema extends JsonSchemaProperty {
  $id?: string;
  $schema?: string;
  // If the root schema is an object, it can have properties, otherwise it's a simple type.
  properties?: { [key: string]: JsonSchemaProperty };
  required?: string[]; // For the root object, defines required top-level fields
}
