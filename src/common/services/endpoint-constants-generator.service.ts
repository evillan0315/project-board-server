// src/common/services/endpoint-constants-generator.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  EndpointDiscoveryService,
  EndpointInfo,
} from './endpoint-discovery.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EndpointConstantsGeneratorService implements OnModuleInit {
  // Define the output directory for the individual constants files.
  // This path assumes the 'frontend' directory is a sibling to the 'src' directory
  // within the 'full-stack' project root.
  // Example project structure:
  // full-stack/
  // ├── src/              (NestJS backend)
  // │   └── common/
  // │       └── services/
  // │           └── endpoint-constants-generator.service.ts (this file)
  // └── frontend/         (Frontend application)
  //     └── src/
  //         └── constants/
  //             └── controllers/  <-- New directory for generated files
  //                 ├── file.endpoints.ts
  //                 ├── user.endpoints.ts
  //                 └── index.ts (re-exports all)
  private readonly FRONTEND_DIR = path.resolve(process.cwd(), 'frontend');
  private readonly OUTPUT_DIR_PATH = path.join(
    // Changed from OUTPUT_FILE_PATH
    this.FRONTEND_DIR,
    'src',
    'constants',
    'controllers', // New subdirectory for controller-specific endpoint files
  );

  constructor(
    private readonly endpointDiscoveryService: EndpointDiscoveryService,
  ) {}

  /**
   * Called once the host module has been initialized.
   * This method automatically triggers the endpoint constants generation
   * when the NestJS application starts.
   *
   * IMPORTANT CONSIDERATION:
   * For production builds, consider moving this generation logic to a separate
   * build script (e.g., a custom NestJS CLI command or a pre-build npm script).
   * This approach avoids unnecessary file writes during runtime and ensures the
   * frontend build process can consume the generated file at the appropriate time
   * (e.g., before `npm run build` for the frontend).
   * For development, running on `OnModuleInit` is convenient.
   */
  async onModuleInit() {
    console.log(
      '[EndpointConstantsGenerator] Starting API endpoint constants generation...',
    );
    try {
      await this.generateEndpointConstantsFiles(); // Renamed method
      console.log(
        `[EndpointConstantsGenerator] API endpoint constants generated successfully in: ${this.OUTPUT_DIR_PATH}`, // Updated message
      );
    } catch (error) {
      console.error(
        '[EndpointConstantsGenerator] Failed to generate API endpoint constants:',
        error,
      );
    }
  }

  /**
   * Converts a camelCase or PascalCase string to SNAKE_CASE.
   * Also removes the '_CONTROLLER' suffix if the input was a controller name.
   *
   * Examples:
   * - 'getUserById' -> 'GET_USER_BY_ID'
   * - 'UserController' -> 'USER'
   * - 'ProductCategory' -> 'PRODUCT_CATEGORY'
   * @param name The input string (e.g., method name or controller name).
   * @returns The string in SNAKE_CASE.
   */
  private formatConstantName(name: string): string {
    return name
      .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1_$2') // Insert underscore before uppercase letters (e.g., getById -> get_ById)
      .toUpperCase() // Convert to uppercase (e.g., GET_BY_ID)
      .replace(/_CONTROLLER$/, ''); // Remove '_CONTROLLER' suffix (e.g., USER_CONTROLLER -> USER)
  }

  /**
   * Formats an API path to ensure it starts with a '/' and does not end with one
   * (unless the path is simply '/').
   *
   * Examples:
   * - 'users' -> '/users'
   * - '/products/' -> '/products'
   * - '/' -> '/'
   * @param apiPath The input API path from NestJS.
   * @returns The normalized path suitable for frontend use.
   */
  private formatPathForFrontend(apiPath: string): string {
    let formattedPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
    if (formattedPath.length > 1 && formattedPath.endsWith('/')) {
      formattedPath = formattedPath.slice(0, -1);
    }
    return formattedPath;
  }

  /**
   * Formats a SNAKE_CASE constant name back to PascalCase for comments.
   *
   * Examples:
   * - 'USER' -> 'User'
   * - 'PRODUCT_CATEGORY' -> 'ProductCategory'
   * @param constantKey The SNAKE_CASE constant name (e.g., controller key).
   * @returns The PascalCase string for human-readable comments.
   */
  private formatNameForComment(constantKey: string): string {
    return constantKey
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Generates individual TypeScript files for each controller's API endpoint constants.
   * Each file will contain an exported const named after the controller (e.g., `FILE_ENDPOINTS`).
   * It also generates an `index.ts` file that re-exports all controller endpoints.
   */
  public async generateEndpointConstantsFiles(): Promise<void> {
    // Renamed method for clarity
    const endpoints = await this.endpointDiscoveryService.getAllEndpoints();

    // Group endpoints by controller for a hierarchical structure in the output file.
    const groupedEndpoints: {
      [controllerName: string]: {
        primaryTags: string[]; // Stores all unique Swagger tags associated with methods in this controller
        endpoints: {
          [handlerName: string]: EndpointInfo;
        };
      };
    } = {};

    for (const endpoint of endpoints) {
      const controllerConstantName = this.formatConstantName(
        endpoint.controller, // e.g., 'UserController' becomes 'USER'
      );
      const handlerConstantName = this.formatConstantName(endpoint.handler);

      if (!groupedEndpoints[controllerConstantName]) {
        groupedEndpoints[controllerConstantName] = {
          primaryTags: [],
          endpoints: {},
        };
      }

      // Collect unique tags for the controller-level comment from all its methods
      if (endpoint.swaggerInfo?.tags) {
        endpoint.swaggerInfo.tags.forEach((tag) => {
          if (
            !groupedEndpoints[controllerConstantName].primaryTags.includes(tag)
          ) {
            groupedEndpoints[controllerConstantName].primaryTags.push(tag);
          }
        });
      }

      groupedEndpoints[controllerConstantName].endpoints[handlerConstantName] =
        endpoint;
    }

    // Ensure the output directory exists before writing files
    if (!fs.existsSync(this.OUTPUT_DIR_PATH)) {
      fs.mkdirSync(this.OUTPUT_DIR_PATH, { recursive: true });
    }

    // Array to hold the names of constants exported from individual files for the index.ts
    const exportedConstantNames: string[] = [];

    // Iterate through grouped controllers to generate individual files
    const sortedControllerKeys = Object.keys(groupedEndpoints).sort();
    for (const controllerKey of sortedControllerKeys) {
      const controllerData = groupedEndpoints[controllerKey];
      const controllerPascalName = this.formatNameForComment(controllerKey);
      const controllerTagsComment =
        controllerData.primaryTags.length > 0
          ? `  // Tags: [${controllerData.primaryTags.map((tag) => `'${tag}'`).join(', ')}]\n`
          : '';

      const constantExportName = `${controllerKey}_ENDPOINTS`; // e.g., FILE_ENDPOINTS
      const outputFileName = `${controllerKey.toLowerCase()}.endpoints.ts`; // e.g., file.endpoints.ts
      const fullOutputPath = path.join(this.OUTPUT_DIR_PATH, outputFileName);
      exportedConstantNames.push(constantExportName); // Add to list for index.ts

      let fileContent = `// This file is auto-generated by NestJS. Do not modify manually.
// Generated on: ${new Date().toISOString()}

// Controller: ${controllerPascalName}
${controllerTagsComment}export const ${constantExportName} = {
`;

      // Sort handlers alphabetically within each controller for consistent output
      const sortedHandlerKeys = Object.keys(controllerData.endpoints).sort();

      for (const handlerKey of sortedHandlerKeys) {
        const endpoint = controllerData.endpoints[handlerKey];
        const fullPath = this.formatPathForFrontend(endpoint.path);
        const method = endpoint.method;
        const summary = endpoint.swaggerInfo?.summary;
        const description = endpoint.swaggerInfo?.description;
        const tags = endpoint.swaggerInfo?.tags;
        const dto = endpoint.swaggerInfo?.dto; // The DTO name used in the request body

        // Add comments for each endpoint constant
        fileContent += `
  // ${method} ${fullPath}
`;
        if (summary) {
          fileContent += `  // Summary: ${summary}\n`;
        }
        if (description) {
          fileContent += `  // Description: ${description}\n`;
        }
        if (method) {
          fileContent += `  // Method: ${method}\n`;
        }
        if (tags && tags.length > 0) {
          fileContent += `  // Tags: [${tags.map((tag) => `'${tag}'`).join(', ')}]\n`;
        }
        if (dto) {
          fileContent += `  // DTO: ${dto}\n`;
        }
        // The actual constant definition
        fileContent += `  ${handlerKey}: '${fullPath}',\n`;
      }
      fileContent += `};
`;
      fs.writeFileSync(fullOutputPath, fileContent, 'utf8');
      console.log(`  Generated: ${outputFileName}`);
    }

    // Generate an index.ts file to re-export all controller endpoint constants
    let indexFileContent = `// This file is auto-generated by NestJS. Do not modify manually.
// Generated on: ${new Date().toISOString()}

`;

    for (const controllerKey of sortedControllerKeys) {
      const constantExportName = `${controllerKey}_ENDPOINTS`;
      const outputFileName = `${controllerKey.toLowerCase()}.endpoints`; // without .ts extension for import
      indexFileContent += `export { ${constantExportName} } from './${outputFileName}';\n`;
    }

    // Optionally, export a single object combining all of them for backward compatibility or convenience
    if (exportedConstantNames.length > 0) {
      indexFileContent += `
/**
 * A comprehensive object containing all API endpoints, grouped by controller.
 * Useful for inspecting all endpoints in a single place.
 */
export const ALL_API_ENDPOINTS = {
${exportedConstantNames.map((name) => `  ...${name},`).join('\n')}
};
`;
    }

    const indexFilePath = path.join(this.OUTPUT_DIR_PATH, 'index.ts');
    fs.writeFileSync(indexFilePath, indexFileContent, 'utf8');
    console.log(
      `  Generated: index.ts (re-exporting all controller endpoints)`,
    );
  }
}
