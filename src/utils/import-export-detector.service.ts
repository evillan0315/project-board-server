import { Injectable } from '@nestjs/common';
import { Project, SourceFile, ScriptTarget, ScriptKind, ts } from 'ts-morph';

/**
 * Interface for a detected import or export statement in code.
 */
export interface DetectedImportExportStatement {
  type: 'import' | 'export';
  /** The module path or name, e.g., './my-module' or 'react'. 'local' for internal exports. */
  moduleSpecifier: string;
  /** Named bindings, e.g., ['Component', 'useState'] for `{ Component, useState }`. */
  namedBindings?: string[];
  /** Namespace import, e.g., 'React' for `import * as React from 'react'` (the 'React' part). */
  namespaceImport?: string;
  /** Default import or export name, e.g., 'MyComponent' for `import MyComponent from './file'` or `export default MyComponent`. */
  defaultImport?: string;
  /** The full raw import/export line from the source code. */
  rawStatement: string;
}

@Injectable()
export class ImportExportDetectorService {
  /**
   * Detects import and export statements within a given code string.
   *
   * @param code The code string to analyze.
   * @param language The programming language, used to determine parsing kind (e.g., 'typescript', 'javascript', 'tsx', 'jsx').
   * @returns An array of detected import/export statements.
   */
  detect(code: string, language: string): DetectedImportExportStatement[] {
    const project = new Project({
      compilerOptions: {
        target: ScriptTarget.Latest,
        moduleResolution: ts.ModuleResolutionKind.NodeJs, // Use NodeJs resolution for in-memory files
        scriptKind: this.getScriptKind(language),
      },
    });

    const sourceFile = project.createSourceFile(
      `temp.${this.getFileExtension(language)}`,
      code,
      { overwrite: true },
    );

    const statements: DetectedImportExportStatement[] = [];

    // Detect Imports
    for (const importDeclaration of sourceFile.getImportDeclarations()) {
      const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
      const rawStatement = importDeclaration.getText();
      const namedBindings: string[] = [];
      let namespaceImport: string | undefined;
      let defaultImport: string | undefined;

      const defaultImportSpecifier = importDeclaration.getDefaultImport();
      if (defaultImportSpecifier) {
        defaultImport = defaultImportSpecifier.getText();
      }

      const namespaceImportSpecifier = importDeclaration.getNamespaceImport();
      if (namespaceImportSpecifier) {
        namespaceImport = namespaceImportSpecifier.getText();
      }

      const namedImports = importDeclaration.getNamedImports();
      for (const namedImport of namedImports) {
        namedBindings.push(namedImport.getName());
      }

      statements.push({
        type: 'import',
        moduleSpecifier,
        namedBindings: namedBindings.length > 0 ? namedBindings : undefined,
        namespaceImport,
        defaultImport,
        rawStatement,
      });
    }

    // Detect Exports
    for (const exportDeclaration of sourceFile.getExportDeclarations()) {
      const moduleSpecifier = exportDeclaration.getModuleSpecifierValue(); // Can be undefined for local exports
      const rawStatement = exportDeclaration.getText();
      const namedBindings: string[] = [];

      const namedExports = exportDeclaration.getNamedExports();
      for (const namedExport of namedExports) {
        // For `export { original as alias }`, getAlias() returns 'alias', getName() returns 'original'
        namedBindings.push(namedExport.getAlias() || namedExport.getName());
      }

      // Handle `export * from './module'`
      if (exportDeclaration.isNamespaceExport()) {
        namedBindings.push('*');
      }

      statements.push({
        type: 'export',
        moduleSpecifier: moduleSpecifier || 'local', // 'local' if no module specifier (e.g., `export const x = 1;`)
        namedBindings: namedBindings.length > 0 ? namedBindings : undefined,
        rawStatement,
      });
    }

    // Also consider `export const x = ...`, `export function f() {}`, `export class C {}`, `export default ...`
    for (const statement of sourceFile.getStatements()) {
      if (
        statement.isKind(ts.SyntaxKind.VariableStatement) ||
        statement.isKind(ts.SyntaxKind.FunctionDeclaration) ||
        statement.isKind(ts.SyntaxKind.ClassDeclaration)
      ) {
        if (statement.isExported()) {
          const declarationNames: string[] = [];
          if (statement.isKind(ts.SyntaxKind.VariableStatement)) {
            statement.getDeclarations().forEach((d) => declarationNames.push(d.getName()));
          } else if (
            statement.isKind(ts.SyntaxKind.FunctionDeclaration) ||
            statement.isKind(ts.SyntaxKind.ClassDeclaration)
          ) {
            const name = statement.getName();
            if (name) declarationNames.push(name);
          }

          if (statement.isDefaultExport()) {
            statements.push({
              type: 'export',
              moduleSpecifier: 'local',
              defaultImport: declarationNames.length > 0 ? declarationNames[0] : undefined, // Fallback for unnamed default exports or if there's no explicit name
              rawStatement: statement.getText(),
            });
          } else {
            statements.push({
              type: 'export',
              moduleSpecifier: 'local',
              namedBindings: declarationNames.length > 0 ? declarationNames : undefined,
              rawStatement: statement.getText(),
            });
          }
        }
      } else if (statement.isKind(ts.SyntaxKind.ExportAssignment)) {
        // Handles `export default expression;` (e.g., `export default { a: 1 };` or `export default MyClass;`)
        statements.push({
          type: 'export',
          moduleSpecifier: 'local',
          defaultImport: statement.getExpression().getText(),
          rawStatement: statement.getText(),
        });
      }
    }

    return statements;
  }

  private getScriptKind(language: string): ScriptKind {
    const lowerCaseLang = language.toLowerCase();
    if (lowerCaseLang === 'typescript' || lowerCaseLang === 'ts') {
      return ScriptKind.TS;
    }
    if (lowerCaseLang === 'tsx') {
      return ScriptKind.TSX;
    }
    if (lowerCaseLang === 'javascript' || lowerCaseLang === 'js') {
      return ScriptKind.JS;
    }
    if (lowerCaseLang === 'jsx') {
      return ScriptKind.JSX;
    }
    return ScriptKind.TS; // Default to TypeScript
  }

  private getFileExtension(language: string): string {
    const lowerCaseLang = language.toLowerCase();
    if (lowerCaseLang === 'typescript') return 'ts';
    if (lowerCaseLang === 'tsx') return 'tsx';
    if (lowerCaseLang === 'javascript') return 'js';
    if (lowerCaseLang === 'jsx') return 'jsx';
    return 'ts'; // Default
  }
}
