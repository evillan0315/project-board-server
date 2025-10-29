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
} from 'class-validator';
export type RelationType = 'one-to-many' | 'many-to-one' | 'one-to-one';
import { Type } from 'class-transformer';

export interface BaseField {
  name: string;
  prismaType: string;
  tsType: string;
  type: string; // Keeping for backward compatibility if template relies on it
  isOptional: boolean;
  validators: string[];
}

export interface ScalarField extends BaseField {
  isRelation: false;
  relationType: null;
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
  relations: { name: string; type: string; isList: boolean }[]; // For module imports
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
      ///const cleanedLine = line.trim().replace(/\\/\\/.*/, '');
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
        // Determine relation type based on array nature
        // The original logic tried to distinguish 'one-to-one' vs 'many-to-one' for non-arrays.
        // We'll preserve this intent, but note that precise determination often requires parsing @relation attributes.
        const relationType: RelationType = isArray
          ? 'one-to-many'
          : 'one-to-one'; // Assuming non-array relation is 'one-to-one' as per original failing code intent.

        allParsedFields.push({
          name,
          prismaType: cleanType,
          tsType,
          type: tsType,
          isOptional,
          isRelation: true,
          relationType,
          targetModel: cleanType, // The related model name
          isList: isArray,
          validators: [], // Validators typically not applied directly to relation fields in DTOs
        });
      } else {
        allParsedFields.push({
          name,
          prismaType: cleanType,
          tsType: isArray ? `${tsType}[]` : tsType,
          type: isArray ? `${tsType}[]` : tsType,
          isOptional,
          isRelation: false,
          relationType: null,
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
      type: f.targetModel,
      isList: f.isList,
    })), // for module imports
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
  let tsType = 'any';
  const validators: string[] = [];
  const label = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

  const decorate = (
    decorator: string,
    message?: string, // message can be optional if not all decorators need it
    options?: Record<string, any>,
  ): string => {
    const decoratorOptions: Record<string, any> = {};

    if (message) {
      decoratorOptions.message = message;
    }

    if (options) {
      Object.assign(decoratorOptions, options);
    }

    if (Object.keys(decoratorOptions).length > 0) {
      const optionsString = Object.entries(decoratorOptions)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(', ');
      return `@${decorator}({ ${optionsString} })`;
    } else {
      return `@${decorator}()`;
    }
  };

  const isEmailField = fieldName.toLowerCase().includes('email');

  switch (prismaType) {
    case 'String':
      tsType = 'string';
      if (!isArray) {
        if (isEmailField) {
          validators.push(
            decorate('IsEmail', `${label} must be a valid email address.`),
          );
        } else {
          validators.push(decorate('IsString', `${label} must be a string.`));
        }
      } else {
        validators.push(decorate('IsArray', `The field ${label} must be an array.`));
        validators.push(
          decorate(
            'IsString',
            `${label} must be an array of strings.`,
            { each: true },
          ),
        );
      }
      break;
    case 'Int':
      tsType = 'number';
      if (!isArray) {
        validators.push(decorate('IsInt', `${label} must be an integer.`));
      } else {
        validators.push(decorate('IsArray', `The field ${label} must be an array.`));
        validators.push(
          decorate('IsInt', `${label} must be an array of integers.`, {
            each: true,
          }),
        );
      }
      break;
    case 'Float':
      tsType = 'number';
      if (!isArray) {
        validators.push(decorate('IsNumber', `${label} must be a float.`));
      } else {
        validators.push(decorate('IsArray', `The field ${label} must be an array.`));
        validators.push(
          decorate('IsNumber', `${label} must be an array of floats.`, {
            each: true,
          }),
        );
      }
      break;
    case 'Boolean':
      tsType = 'boolean';
      if (!isArray) {
        validators.push(
          decorate('IsBoolean', `${label} must be true or false. `),
        );
      } else {
        validators.push(decorate('IsArray', `The field ${label} must be an array.`));
        validators.push(
          decorate('IsBoolean', `${label} must be an array of booleans.`, {
            each: true,
          }),
        );
      }
      break;
    case 'DateTime':
      tsType = 'Date';
      if (!isArray) {
        validators.push(decorate('IsDate', `${label} must be a date.`));
      } else {
        validators.push(decorate('IsArray', `The field ${label} must be an array.`));
        validators.push(
          decorate('IsDate', `${label} must be an array of dates.`, {
            each: true,
          }),
        );
      }
      break;
    case 'Json':
      tsType = 'any';
      if (!isArray) {
        validators.push(decorate('IsObject', `${label} must be an object.`));
      } else {
        validators.push(decorate('IsArray', `The field ${label} must be an array.`));
        validators.push(
          decorate('IsObject', `${label} must be an array of objects.`, {
            each: true,
          }),
        );
      }
      break;
    case 'Decimal':
      tsType = 'string';
      if (!isArray) {
        validators.push(
          decorate(
            'IsString',
            `${label} must be a string representing a decimal number.`,
          ),
        );
      } else {
        validators.push(decorate('IsArray', `The field ${label} must be an array.`));
        validators.push(
          decorate(
            'IsString',
            `${label} must be an array of decimal strings.`,
            { each: true },
          ),
        );
      }
      break;
    case 'BigInt':
      tsType = 'bigint | number';
      if (!isArray) {
        validators.push(decorate('IsDefined', `${label} must be defined.`));
      } else {
        validators.push(decorate('IsArray', `The field ${label} must be an array.`));
        validators.push(
          decorate('IsDefined', `${label} must be an array of big integers.`, {
            each: true,
          }),
        );
      }
      break;
    case 'Bytes':
      tsType = 'Buffer | string';
      if (!isArray) {
        validators.push(decorate('IsDefined', `${label} must be defined.`));
      } else {
        validators.push(decorate('IsArray', `The field ${label} must be an array.`));
        validators.push(
          decorate('IsDefined', `${label} must be an array of bytes.`, {
            each: true,
          }),
        );
      }
      break;
    default:
      tsType = 'string';
      if (!isArray) {
        validators.push(decorate('IsString', `${label} must be a string.`));
      } else {
        validators.push(decorate('IsArray', `The field ${label} must be an array.`));
        validators.push(
          decorate('IsString', `${label} must be an array of strings.`, {
            each: true,
          }),
        );
      }
      break;
  }

  if (isOptional) {
    validators.unshift(decorate('IsOptional', `${label} is optional.`));
  }
  return { tsType, validators };
}
