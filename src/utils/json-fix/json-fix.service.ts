 // src/utils/json-fix/json-fix.service.ts
import { Injectable } from "@nestjs/common";
import JSON5 from "json5";
import Hjson from "hjson";
import Ajv from "ajv";

@Injectable()
export class JsonFixService {
  private ajv = new Ajv();

  validate(json: string, schema?: string) {
    try {
      const parsed = JSON.parse(json);
      if (schema) {
        const validator = this.ajv.compile(JSON.parse(schema));
        const valid = validator(parsed);
        return { valid, errors: validator.errors || [] };
      }
      return { valid: true };
    } catch (e) {
      return { valid: false, errors: [e.message] };
    }
  }

  repair(json: string) {
    try {
      const obj = JSON5.parse(json);
      return { repaired: JSON.stringify(obj, null, 2), valid: true };
    } catch {
      try {
        const obj = Hjson.parse(json);
        return { repaired: JSON.stringify(obj, null, 2), valid: true };
      } catch (e) {
        return { valid: false, errors: [e.message] };
      }
    }
  }
}