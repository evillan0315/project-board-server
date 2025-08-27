import { Injectable } from '@nestjs/common';
import * as JSON5 from 'json5';
import * as Hjson from 'hjson';
import Ajv from 'ajv';
import { JsonOutputDto } from './dto/json-output.dto';

@Injectable()
export class JsonFixService {
  private ajv = new Ajv();

  /**
   * Validates a JSON string, optionally against a provided JSON schema.
   * @param jsonString The JSON string to validate.
   * @param schema Optional JSON schema (object or string) to validate against.
   * @returns JsonOutputDto indicating validity and any errors.
   */
  validate(jsonString: string, schema?: unknown): JsonOutputDto {
    try {
      // Attempt to parse the input string directly as strict JSON
      const parsed = JSON.parse(jsonString);

      if (schema) {
        let schemaObj: Record<string, any>;
        try {
          // If schema is a string, parse it. Otherwise, use it directly.
          schemaObj =
            typeof schema === 'string' ? JSON.parse(schema) : (schema as Record<string, any>);
        } catch (e) {
          // If schema itself is invalid JSON, report an error
          return {
            valid: false,
            errors: [`Invalid schema format: ${e.message}`],
          };
        }

        const validator = this.ajv.compile(schemaObj);
        const valid = validator(parsed);

        return {
          valid,
          // Map AJV errors for consistency, if present
          errors:
            validator.errors?.map((err) => ({
              message: err.message,
              instancePath: err.instancePath,
              keyword: err.keyword,
              params: err.params,
            })) || [],
        };
      }

      // If no schema, and JSON.parse succeeded, it's valid
      return { valid: true };
    } catch (e) {
      // If JSON.parse throws, the input string is not valid JSON
      return {
        valid: false,
        errors: [String(e.message)],
      };
    }
  }

  /**
   * Recursively cleans a parsed JSON structure by attempting to parse stringified JSON values.
   * If a stringified JSON value is malformed and cannot be strictly parsed, it is removed.
   * @param data The object or array to clean.
   * @returns A new, cleaned object or array, or the original data if it's a primitive.
   */
  private deepCleanAndRemoveInvalidJsonStrings(data: any): any {
    if (Array.isArray(data)) {
      const cleanedArray: any[] = [];
      for (const item of data) {
        const cleanedItem = this.deepCleanAndRemoveInvalidJsonStrings(item);
        // If `cleanedItem` is null, it means it was a broken stringified JSON and should be removed.
        if (cleanedItem !== null) {
          cleanedArray.push(cleanedItem);
        }
      }
      return cleanedArray;
    } else if (typeof data === 'object' && data !== null) {
      const cleanedObject: Record<string, any> = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = data[key];

          if (typeof value === 'string') {
            // Check if the string might be JSON (starts with { or [)
            const trimmedValue = value.trim();
            if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
              try {
                // Attempt to parse stringified JSON value with strict JSON.parse
                const nestedParsed = JSON.parse(trimmedValue);
                // Recursively clean the nested structure if successfully parsed
                const cleanedNested = this.deepCleanAndRemoveInvalidJsonStrings(nestedParsed);

                // If the cleaned nested structure is not null (i.e., not entirely removed)
                if (cleanedNested !== null) {
                  cleanedObject[key] = cleanedNested;
                }
                // If it was null, the property is implicitly removed by not assigning it.
              } catch (e) {
                // If string cannot be parsed as strict JSON, it's a "broken json object item".
                // Skip adding this property/item to the cleaned object/array (effectively removing it).
                // console.warn(`Removed broken stringified JSON at key '${key}': ${trimmedValue.substring(0, Math.min(trimmedValue.length, 50))}... Error: ${e.message}`);
              }
            } else {
              // It's a non-JSON string, keep it as is.
              cleanedObject[key] = value;
            }
          } else {
            // For non-string types (numbers, booleans, null, other objects/arrays), recurse.
            const cleanedValue = this.deepCleanAndRemoveInvalidJsonStrings(value);
            // If the recursive call returns null (meaning it was a broken stringified JSON that was removed),
            // then remove this property.
            if (cleanedValue !== null) {
              cleanedObject[key] = cleanedValue;
            }
          }
        }
      }
      return cleanedObject;
    }
    // For primitive types (number, boolean, null, undefined) or non-JSON strings that don't look like JSON,
    // return as is.
    return data;
  }

  /**
   * Attempts to repair an invalid JSON string using lenient parsers (JSON5, Hjson)
   * and then removes any nested malformed JSON string items.
   * @param jsonString The JSON string to repair.
   * @returns JsonOutputDto with the repaired JSON or errors if unrepairable.
   */
  async repair(jsonString: string): Promise<JsonOutputDto> {
    let repairedObj: any = null;
    const errors: string[] = [];

    // Attempt 1: Standard JSON parse (if already valid strict JSON)
    try {
      repairedObj = JSON.parse(jsonString);
      // If it's valid strict JSON, apply deep clean in case of nested stringified JSONs
      const cleanedObj = this.deepCleanAndRemoveInvalidJsonStrings(repairedObj);
      return { repairedJson: JSON.stringify(cleanedObj, null, 2), valid: true };
    } catch (e) {
      errors.push(`Strict JSON.parse failed: ${e.message}`);
    }

    // Attempt 2: Lenient parse with JSON5 (only if strict parse failed)
    if (repairedObj === null) {
      try {
        repairedObj = JSON5.parse(jsonString);
        errors.push('JSON5.parse succeeded (lenient top-level repair)');
      } catch (e) {
        errors.push(`JSON5.parse failed: ${e.message}`);
        // Attempt 3: Lenient parse with Hjson (only if JSON5 failed)
        try {
          repairedObj = Hjson.parse(jsonString);
          errors.push('Hjson.parse succeeded (lenient top-level repair)');
        } catch (e) {
          errors.push(`Hjson.parse failed: ${e.message}`);
        }
      }
    }

    if (repairedObj === null) {
      // If all parsing attempts failed to even get a top-level object
      return {
        valid: false,
        errors: [`Could not repair top-level JSON structure. Errors: ${errors.join('; ')}`],
      };
    } else {
      // If a lenient parse succeeded, now deep clean it for broken stringified JSON items
      const cleanedObj = this.deepCleanAndRemoveInvalidJsonStrings(repairedObj);
      return { repairedJson: JSON.stringify(cleanedObj, null, 2), valid: true };
    }
  }
}
