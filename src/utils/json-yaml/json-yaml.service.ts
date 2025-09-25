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
      return yaml.dump(json, { 
        noRefs: true,
        lineWidth: -1 // Prevent line wrapping
      });
    } catch (err) {
      throw new Error(`Failed to convert JSON to YAML: ${err.message}`);
    }
  }

  /**
   * Converts a YAML string to JSON object.
   */
  yamlToJson(yamlStr: string): Record<string, unknown> {
    try {
      // First clean the YAML string by removing markdown code blocks
      const cleanedYaml = this.cleanYamlString(yamlStr);
      
      // Try to parse directly
      return yaml.load(cleanedYaml) as Record<string, unknown>;
    } catch (err) {
      // If parsing fails, try to fix common issues and parse again
      try {
        const cleanedYaml = this.cleanYamlString(yamlStr);
        const fixedYaml = this.fixYamlSyntax(cleanedYaml);
        return yaml.load(fixedYaml) as Record<string, unknown>;
      } catch (fixErr) {
        throw new Error(`Failed to convert YAML to JSON: ${fixErr.message}`);
      }
    }
  }

  /**
   * Cleans YAML string by removing markdown code block delimiters
   */
  private cleanYamlString(yamlStr: string): string {
    // Remove ```yaml and ``` markers
    return yamlStr
      .replace(/^```yaml\s*/gim, '')
      .replace(/```$/gim, '')
      .trim();
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

  /**
   * Helper method to fix common YAML syntax issues
   */
  fixYamlSyntax(yamlStr: string): string {
    let fixedYaml = yamlStr;
    
    // Fix 1: Ensure proper indentation for lists
    fixedYaml = fixedYaml.replace(/(\w+:)\s*-\s*/g, '$1\n  - ');
    
    // Fix 2: Properly escape newContent field to prevent YAML parsing issues
    fixedYaml = this.escapeNewContent(fixedYaml);
    
    // Fix 3: Ensure consistent 2-space indentation
    fixedYaml = fixedYaml.replace(/\t/g, '  '); // Replace tabs with spaces
    
    return fixedYaml;
  }

  /**
   * Properly escape the newContent field to prevent YAML parsing issues
   */
  private escapeNewContent(yamlStr: string): string {
    const lines = yamlStr.split('\n');
    let inNewContent = false;
    let newContentIndent = 0;
    const result: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if we're entering a newContent block
      if (line.includes('newContent:') && line.trim().endsWith('|')) {
        inNewContent = true;
        newContentIndent = line.indexOf('newContent:');
        result.push(line);
        continue;
      }
      
      // If we're in a newContent block, escape YAML special characters
      if (inNewContent) {
        // Check if we've exited the newContent block
        if (line.trim().length > 0 && line.indexOf(line.trim()) <= newContentIndent) {
          inNewContent = false;
        } else {
          // Escape any YAML-like content within newContent
          const escapedLine = line
            .replace(/^(\s*)([a-zA-Z_][a-zA-Z0-9_]*):/g, '$1"$2":') // Quote keys
            .replace(/^(\s*)- /g, '$1" - "'); // Convert list items to strings
          result.push(escapedLine);
          continue;
        }
      }
      
      result.push(line);
    }
    
    return result.join('\n');
  }

  /**
   * Validates YAML syntax
   */
  validateYaml(yamlStr: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      const cleanedYaml = this.cleanYamlString(yamlStr);
      yaml.load(cleanedYaml);
      return { isValid: true, errors: [] };
    } catch (err) {
      errors.push(err.message);
      return { isValid: false, errors };
    }
  }
}