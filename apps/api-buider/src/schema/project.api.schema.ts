import { ApiSchema, RouteDefinition, schemaValidator } from "../builder";
import { Request, Response } from "express";
// Import the project.json as a TypeScript module (requires resolveJsonModule in tsconfig)
import projectMetadataSchema from "./project.json";

// NOTE: In a real application, 'projectMetadata' would be persisted in a database
// and its type would likely be an interface generated from project.json or defined manually.
// For this example, we'll use a simple in-memory variable.

/**
 * A simple in-memory "data store" for project metadata. 
 * In a real application, this would interact with a database.
 */
let projectMetadata: typeof projectMetadataSchema | null = null;

/**
 * Controller to handle POST requests for project metadata.
 * Validates the request body against projectMetadataSchema and stores it.
 */
async function createOrUpdateProjectMetadata(req: Request, res: Response) {
  // The body is already validated by schemaValidator middleware
  projectMetadata = req.body;
  res.status(200).json({ message: "Project metadata saved successfully", data: projectMetadata });
}

/**
 * Controller to handle GET requests for project metadata.
 * Returns the currently stored project metadata.
 */
async function getProjectMetadata(req: Request, res: Response) {
  if (projectMetadata) {
    res.json(projectMetadata);
  } else {
    res.status(404).json({ error: "Project metadata not found" });
  }
}

/**
 * Define API routes for project metadata.
 */
const routes: RouteDefinition[] = [
  {
    method: "post",
    path: "/projects/metadata",
    description: "Create or update project metadata using project.json schema",
    handlers: [
      schemaValidator(projectMetadataSchema as any), // Cast to 'any' because AJV's JSONSchemaType is generic
      createOrUpdateProjectMetadata
    ],
    requestSchema: projectMetadataSchema as any // Optional: include for documentation/introspection
  },
  {
    method: "get",
    path: "/projects/metadata",
    description: "Retrieve current project metadata",
    handlers: [getProjectMetadata]
  }
];

/**
 * Export the ApiSchema for project metadata.
 */
export const projectApiSchema: ApiSchema = {
  basePath: "/api/v1", // Consistent with example.schema.ts
  routes
};
