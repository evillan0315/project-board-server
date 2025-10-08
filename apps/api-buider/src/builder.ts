import { Application, Request, Response, NextFunction } from "express";
import Ajv, { JSONSchemaType } from "ajv";
import addFormats from "ajv-formats"; // 👈 add this
type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export type HandlerFunc = (req: Request, res: Response, next: NextFunction) => Promise<any> | any;

export type RouteDefinition = {
  method: HttpMethod;
  path: string;
  handlers: HandlerFunc[]; // can include validation, controllers, etc.
  description?: string;
  requestSchema?: JSONSchemaType<any>;
};

// A Schema is simply a collection of RouteDefinitions
export type ApiSchema = {
  basePath?: string;
  routes: RouteDefinition[];
};

// Configure Ajv to not enforce strict mode for unknown keywords like 'x-multiline' or 'x-order'
const ajv = new Ajv({ strict: false }); // <--- Modified here
addFormats(ajv); 
/**
 * Helper: wraps a JSON schema as an Express middleware validator
 */
export function schemaValidator(schema: JSONSchemaType<any>): HandlerFunc {
  const validate = ajv.compile(schema);
  return (req, res, next) => {
    const valid = validate(req.body);
    if (!valid) {
      return res.status(400).json({ errors: validate.errors });
    }
    next();
  };
}

/**
 * buildApiFromSchema
 * Iterates the schema and registers Express routes.
 */
export function buildApiFromSchema(app: Application, schema: ApiSchema) {
  const base = schema.basePath || "";
  for (const r of schema.routes) {
    const fullPath = `${base}${r.path}`;
    // Map method to express function and register the chain of handlers
    // We keep error handling minimal: let handlers decide to call next(err)
    switch (r.method) {
      case "get":
        app.get(fullPath, ...r.handlers);
        break;
      case "post":
        app.post(fullPath, ...r.handlers);
        break;
      case "put":
        app.put(fullPath, ...r.handlers);
        break;
      case "patch":
        app.patch(fullPath, ...r.handlers);
        break;
      case "delete":
        app.delete(fullPath, ...r.handlers);
        break;
      default:
        throw new Error(`Unsupported method: ${(r as any).method}`);
    }
    console.log(`Registered: [${r.method.toUpperCase()}] ${fullPath}${r.description ? " — " + r.description : ""}`);
  }

  // Basic 404 for unmatched API routes
  app.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

  // Simple error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(err?.status || 500).json({ error: err?.message || "Internal Server Error" });
  });
}
