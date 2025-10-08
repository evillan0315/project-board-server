/**
FilePath: src/server.ts
Title: Express server entrypoint
Reason: Bootstraps Express, registers builder routes, and starts the server
*/
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { buildApiFromSchema } from "./builder";
import { exampleSchema } from "./schema/example.schema";
import { projectApiSchema } from "./schema/project.api.schema"; // NEW: Import the project metadata API schema

const app = express();
app.use(cors());
app.use(bodyParser.json());

/**
 * Build API routes from the provided schema.
 * The builder will attach routes to the `app` instance.
 */
buildApiFromSchema(app, exampleSchema);
buildApiFromSchema(app, projectApiSchema); // NEW: Register the project metadata API schema

const PORT = 3003;
app.listen(PORT, () => {
  // keep logs minimal and useful
  console.log(`API builder running on http://localhost:${PORT}`);
});
