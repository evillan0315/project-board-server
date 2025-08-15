import { Injectable } from '@nestjs/common';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class JsonYamlService {
  /**
   * Converts a JSON object to YAML string.
   */
  jsonToYaml(json: Record<string, unknown>): string {
    try {
      return yaml.dump(json, { noRefs: true });
    } catch (err) {
      throw new Error(`Failed to convert JSON to YAML: ${err.message}`);
    }
  }

  /**
   * Converts a YAML string to JSON object.
   */
  yamlToJson(yamlStr: string): Record<string, unknown> {
    try {
      return yaml.load(yamlStr) as Record<string, unknown>;
    } catch (err) {
      throw new Error(`Failed to convert YAML to JSON: ${err.message}`);
    }
  }

  /**
   * Saves the conversion result to a file in the output directory.
   * Returns the relative file path.
   */
  saveResult(content: string, filename: string): string {
    const outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, content, 'utf8');
    return `output/${filename}`;
  }
}
