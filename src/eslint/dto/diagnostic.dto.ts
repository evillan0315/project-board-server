// src/eslint/dto/diagnostic.dto.ts (Matches CodeMirror's Diagnostic interface)
export type Severity = 'info' | 'warning' | 'error';

export interface DiagnosticAction {
  name: string;
  apply: string; // A string representing the fix logic, to be eval'd or processed by client
  // For a real-world scenario, apply would be an identifier for a specific fix,
  // and the client would know how to implement it. Sending a string to eval is dangerous.
  // For this example, we'll keep it simple for demonstration.
}

export class DiagnosticDto {
  from: number; // Start character offset
  to: number; // End character offset
  message: string;
  severity: Severity;
  source?: string; // e.g., "eslint"
  actions?: DiagnosticAction[];
}
