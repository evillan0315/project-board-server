// src/utils/json-fix/json-fix.service.ts
import { Injectable } from '@nestjs/common';
import * as JSON5 from 'json5';
import * as Hjson from 'hjson';
import Ajv from 'ajv';

@Injectable()
export class JsonFixService {
  private ajv = new Ajv();

  validate(json: string, schema?: unknown) {
    try {
      const parsed = JSON.parse(json);

      if (schema) {
        let schemaObj: Record<string, any>;
        let schemaType: 'string' | 'object';

        if (typeof schema === 'string') {
          schemaObj = JSON.parse(schema);
          schemaType = 'string';
        } else {
          schemaObj = schema as Record<string, any>;
          schemaType = 'object';
        }

        const validator = this.ajv.compile(schemaObj);
        const valid = validator(parsed);

        return {
          valid,
          errors: validator.errors || [],
          schemaType,
          schema: schemaObj,
        };
      }

      return { valid: true, schemaType: 'none' };
    } catch (e) {
      return {
        valid: false,
        errors: [String(e.message)],
        schemaType: 'invalid',
      };
    }
  }

  repair(json: string) {
    try {
      const obj = JSON5.parse(json);
      return { repairedJson: JSON.stringify(obj, null, 2), valid: true };
    } catch {
      try {
        const obj = Hjson.parse(json);
        return { repairedJson: JSON.stringify(obj, null, 2), valid: true };
      } catch (e) {
        return { valid: false, errors: [String(e.message)] };
      }
    }
  }
}
