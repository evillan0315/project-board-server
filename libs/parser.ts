import * as fs from 'fs';
import * as path from 'path';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  IsBoolean,
  IsNumber,
  IsInt,
  IsDate,
  IsUUID,
  IsObject,
  IsPositive,
  IsDefined, // Keep IsDefined for explicit usage if ever needed, though often implied
} from 'class-validator';
import { Type } from 'class-transformer'; // Needed for @Type
export type RelationType = 'one-to-many' | 'many-to-one' | 'one-to-one';
export interface BaseField {
  name: string;
  prismaType: string;
  tsType: string;
  isOptional: boolean;
  validators: string[];
}
export interface ScalarField extends BaseField {
  isRelation: false;
}
export interface RelationField extends BaseField {
  isRelation: true;
  relationType: RelationType;
  targetModel: string; // The name of the related Prisma model (e.g., 'User')
  isList: boolean; // True if it's a list (e.g., `posts Post[]`)
}
export type AnyParsedField = ScalarField | RelationField;
export interface ModelParseResult {
  fields: ScalarField[]; // For DTOs
  hasCreatedBy: boolean;
    hasSubmittedById: boolean;
  relations: { name: string; type: string; isList: boolean }[]; // For module imports and @Type() decorator
}
export function parseModel(modelName: string): ModelParseResult {
  const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
  const content = fs.readFileSync(schemaPath, 'utf8');
  const modelRegex = new RegExp(`model\\s+${modelName}\\s+\{([\\s\\S]*?)\}`, 'm');
  const match = content.match(modelRegex);
  if (!match) throw new Error(`Model ${modelName} not found.`);
  const SCALAR_TYPES = [
    'String',
    'Int',
    'Float',
    'Boolean',
    'DateTime',
    'Json',
    'Bytes',
    'Decimal',
    'BigInt',
  ];
  const allParsedFields: AnyParsedField[] = [];
  let hasCreatedBy = false;
  let hasSubmittedById = false;
  match[1]
    .trim()
    .split('\n')
    .forEach((line) => {
      const cleanedLine = line.trim().replace(/\/\/.*/, '');
      if (!cleanedLine || cleanedLine.startsWith('@@')) return; // Ignore empty lines and model-level attributes
      const parts = cleanedLine.split(/\\s+/);
      if (parts.length < 2) return;
      const [name, rawType] = parts;
      const isOptional = rawType.endsWith('?');
      const isArray = rawType.includes('[]');
      const cleanType = rawType.replace('?', '').replace('[]', '');
      const isPrismaScalar = SCALAR_TYPES.includes(cleanType);
      const isRelation = !isPrismaScalar;
      if (name === 'createdBy' || name === 'createdById') {
        hasCreatedBy = true;
      }
      if (name === 'submittedById') {
        hasSubmittedById = true;
      }
      const { tsType, validators } = mapPrismaTypeToTsType(
        cleanType,
        isOptional,
        isArray,
        name,
      );
      if (isRelation) {
        // A non-array relation field like `author User` implies a Many-to-One relation
        // from the current model's perspective (many posts belong to one author).
        // A list relation field like `posts Post[]` implies a One-to-Many relation.
        const relationType: RelationType = isArray
          ? 'one-to-many'
          : 'many-to-one'; // Default to many-to-one for single relations
        const relationModelClassName = cleanType; // e.g., 'User'
        const relationDtoClassName = `Create${relationModelClassName}Dto`; // e.g., 'CreateUserDto'
        allParsedFields.push({
          name,
          prismaType: cleanType,
          tsType: isArray ? `${relationDtoClassName}[]` : relationDtoClassName, // Set tsType to DTO class name for relations
          isOptional,
          isRelation: true,
          relationType,
          targetModel: relationModelClassName, // Keep original model name for generating import path
          isList: isArray,
          validators: [], // Validators for relation fields are handled by @Type and nested DTOs
        });
      } else {
        allParsedFields.push({
          name,
          prismaType: cleanType,
          tsType: isArray ? `${tsType}[]` : tsType, // For scalar arrays
          isOptional,
          isRelation: false,
          validators,
        });
      }
    });
  const scalarFields = allParsedFields.filter(
    (f): f is ScalarField => !f.isRelation,
  );
  const relationFields = allParsedFields.filter(
    (f): f is RelationField => f.isRelation,
  );
  return {
    fields: scalarFields, // for DTO generation
    relations: relationFields.map((f) => ({
      name: f.name,
      type: f.targetModel, // Pass the original model name for DTO import paths
      isList: f.isList,
    })),
    hasCreatedBy,
    hasSubmittedById,
  };
}
function mapPrismaTypeToTsType(
  prismaType: string,
  isOptional: boolean,
  isArray: boolean,
  fieldName: string,
): {
  tsType: string;
  validators: string[];
} {
  let tsType = 'any'; // Default to 'any' for safety, though it should always be overridden
  const validators: string[] = [];
  // Capitalize field name for better error messages
  const label = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  const decorate = (
    decorator: string,
    message?: string,
    options?: Record<string, any>, // options can now contain strings that represent code
  ): string => {
    let optionsParts: string[] = [];
    if (message) {
      optionsParts.push(`description: \"\`${message.replace(/`/g, '\\`')}\`\"`); // Use backticks for message
    }
    if (options) {
      for (const key in options) {
        if (Object.prototype.hasOwnProperty.call(options, key)) {
          const value = options[key];
          // Special handling for class-transformer's @Type and other raw code strings
          if (key === 'type' && typeof value === 'string' && value.startsWith('() =>')) {
            optionsParts.push(`${key}: ${value}`); // Pass as raw code, e.g., '() => Date'
          } else {
            optionsParts.push(`${key}: ${JSON.stringify(value)}`); // Stringify other values
          }
        }
      }
    }
    if (optionsParts.length > 0) {
      return `@${decorator}({ ${optionsParts.join(', ')} })`;
    } else {
      return `@${decorator}()`;
    }
  };
  // Helper to correctly add IsOptional, ensuring it's first if present
  const addOptional = (validator: string) => {
    if (isOptional && !validators.some(v => v.includes('@IsOptional')) ) {
      validators.push(decorate('IsOptional'));
    }
    validators.push(validator);
  }
  const isEmailField = fieldName.toLowerCase().includes('email');
  switch (prismaType) {
    case 'String':
      tsType = 'string';
      if (!isArray) {
        if (isEmailField) {
          addOptional(decorate('IsEmail', `'${label}' must be a valid email address.`));
        } else {
          addOptional(decorate('IsString', `'${label}' must be a string.`));
        }
      } else {
        addOptional(decorate('IsArray', `The field '${label}' must be an array.`));
        addOptional(
          decorate('IsString', `'${label}' must be an array of strings.`, {
            each: true,
          }),
        );
      }
      break;
    case 'Int':
      tsType = 'number';
      if (!isArray) {
        addOptional(decorate('IsInt', `'${label}' must be an integer.`));
      } else {
        addOptional(decorate('IsArray', `The field '${label}' must be an array.`));
        addOptional(
          decorate('IsInt', `'${label}' must be an array of integers.`, {
            each: true,
          }),
        );
      }
      break;
    case 'Float':
      tsType = 'number';
      if (!isArray) {
        addOptional(decorate('IsNumber', `'${label}' must be a float number.`));
      } else {
        addOptional(decorate('IsArray', `The field '${label}' must be an array.`));
        addOptional(
          decorate('IsNumber', `'${label}' must be an array of float numbers.`, {
            each: true,
          }),
        );
      }
      break;
    case 'Boolean':
      tsType = 'boolean';
      if (!isArray) {
        addOptional(
          decorate('IsBoolean', `'${label}' must be a boolean value. `),
        );
      } else {
        addOptional(decorate('IsArray', `The field '${label}' must be an array.`));
        addOptional(
          decorate('IsBoolean', `'${label}' must be an array of boolean values.`, {
            each: true,
          }),
        );
      }
      break;
    case 'DateTime':
      tsType = 'Date';
      if (!isArray) {
        addOptional(decorate('IsDate', `'${label}' must be a valid date instance.`));
        validators.push(decorate('Type', undefined, { type: '() => Date' }));
      } else {
        addOptional(decorate('IsArray', `The field '${label}' must be an array.`));
        addOptional(
          decorate('IsDate', `'${label}' must be an array of valid date instances.`, {
            each: true,
          }),
        );
        validators.push(decorate('Type', undefined, { type: '() => Date', each: true }));
      }
      break;
    case 'Json':
      tsType = 'any'; // Or a more specific interface if known
      if (!isArray) {
        addOptional(decorate('IsObject', `'${label}' must be an object.`));
      } else {
        addOptional(decorate('IsArray', `The field '${label}' must be an array.`));
        addOptional(
          decorate('IsObject', `'${label}' must be an array of objects.`, {
            each: true,
          }),
        );
      }
      break;
    case 'Decimal':
      tsType = 'string'; // Represent Decimal as string to avoid precision issues
      if (!isArray) {
        addOptional(
          decorate(
            'IsString',
            `'${label}' must be a string representing a decimal number.`,
          ),
        );
      } else {
        addOptional(decorate('IsArray', `The field '${label}' must be an array.`));
        addOptional(
          decorate(
            'IsString',
            `'${label}' must be an array of decimal strings.`,
            { each: true },
          ),
        );
      }
      break;
    case 'BigInt':
      tsType = 'string'; // Represent BigInt as string for consistent JSON serialization/deserialization
      if (!isArray) {
        addOptional(decorate('IsString', `'${label}' must be a string representing a big integer.`));
      } else {
        addOptional(decorate('IsArray', `The field '${label}' must be an array.`));
        addOptional(
          decorate('IsString', `'${label}' must be an array of big integer strings.`, {
            each: true,
          }),
        );
      }
      break;
    case 'Bytes':
      tsType = 'string'; // Represent Bytes as base64 string
      if (!isArray) {
        addOptional(decorate('IsString', `'${label}' must be a base64 encoded string.`));
      } else {
        addOptional(decorate('IsArray', `The field '${label}' must be an array.`));
        addOptional(
          decorate('IsString', `'${label}' must be an array of base64 encoded strings.`, {
            each: true,
          }),
        );
      }
      break;
    default:
      // Handle Enums or other custom types. For now, treat as string.
      tsType = 'string'; // Default to string if not a known scalar type or relation.
      if (!isArray) {
        addOptional(decorate('IsString', `'${label}' must be a string.`));
      } else {
        addOptional(decorate('IsArray', `The field '${label}' must be an array.`));
        addOptional(
          decorate('IsString', `'${label}' must be an array of strings.`, {
            each: true,
          }),
        );
      }
      break;
  }
  return { tsType, validators };
}
