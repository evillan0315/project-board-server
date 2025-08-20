 import { Project, ts } from 'ts-morph';
import * as path from 'path';

/**
 * A script to detect local imports and get their resolved file paths
 * using the ts-morph library.
 */

async function findLocalImports(filePath: string): Promise<void> {
    try {
        // Create a new ts-morph project instance.
        const project = new Project({
            // Pass the path to your tsconfig.json to ensure correct module resolution
            // and path alias handling.
            // If you don't have a tsconfig.json, you can omit this option.
            tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
            // Optionally, specify compiler options directly.
            compilerOptions: {
                moduleResolution: ts.ModuleResolutionKind.NodeJs,
            },
        });

        // Add the target source file to the project.
        const sourceFile = project.addSourceFileAtPath(filePath);

        // Get all import declarations from the file.
        const importDeclarations = sourceFile.getImportDeclarations();
        console.log(`Analyzing file: ${sourceFile.getFilePath()}`);
        console.log('---');

        for (const importDeclaration of importDeclarations) {
            // Get the module specifier (the string after 'from').
            const moduleSpecifier = importDeclaration.getModuleSpecifierValue();

            // Check if the import path is a relative one.
            const isLocal = moduleSpecifier.startsWith('.') || moduleSpecifier.startsWith('..');

            if (isLocal) {
                // If it's a local import, get the source file it resolves to.
                const resolvedSourceFile = importDeclaration.getModuleSpecifierSourceFile();

                if (resolvedSourceFile) {
                    // Get the absolute file path of the resolved source file.
                    const resolvedPath = resolvedSourceFile.getFilePath();
                    console.log(`Local Import found: "${moduleSpecifier}"`);
                    console.log(`Resolved path: ${resolvedPath}`);
                    console.log('---');
                } else {
                    console.warn(`Warning: Could not resolve local import "${moduleSpecifier}"`);
                }
            }
        }
    } catch (error) {
        console.error('An error occurred:', error.message);
        console.error('Please ensure the file path and tsconfig.json are correct.');
    }
}

// Get the file path from the command line arguments.
const filePath = process.argv[2];

if (!filePath) {
    console.error('Please provide a file path as an argument. Example:');
    console.error('ts-node detectImports.ts ./src/your-file.ts');
    process.exit(1);
}

findLocalImports(path.resolve(filePath));

