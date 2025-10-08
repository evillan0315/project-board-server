/**
FilePath: src/schema/example.schema.ts
Title: Example API schema demonstrating builder usage
Reason: Provide a concrete schema with validation and controller handlers to test the builder
*/
import { ApiSchema, RouteDefinition, schemaValidator } from "../builder";
import { Request, Response } from "express";

/**
 * Simple in-memory "data store" for demo purposes.
 * Replace with DB calls in real apps.
 */
const users: Array<{ id: number; name: string; email: string }> = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
];

const createUserSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    email: { type: "string", format: "email" }
  },
  required: ["name", "email"],
  additionalProperties: false
} as const;

/**
 * Controllers / handlers
 */
async function listUsers(req: Request, res: Response) {
  res.json(users);
}

async function getUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
}

async function createUser(req: Request, res: Response) {
  const { name, email } = req.body;
  const id = users.length ? users[users.length - 1].id + 1 : 1;
  const user = { id, name, email };
  users.push(user);
  res.status(201).json(user);
}

async function updateUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ error: "User not found" });
  const payload = req.body as Partial<{ name: string; email: string }>;
  users[idx] = { ...users[idx], ...payload };
  res.json(users[idx]);
}

async function deleteUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ error: "User not found" });
  users.splice(idx, 1);
  res.status(204).send();
}

/**
 * Build the route definitions
 */
const routes: RouteDefinition[] = [
  { method: "get", path: "/users", handlers: [listUsers], description: "List users" },
  { method: "get", path: "/users/:id", handlers: [getUser], description: "Get a user by id" },
  {
    method: "post",
    path: "/users",
    handlers: [schemaValidator(createUserSchema as any), createUser],
    description: "Create a new user",
    requestSchema: createUserSchema as any
  },
  {
    method: "put",
    path: "/users/:id",
    handlers: [updateUser],
    description: "Replace user (simple demo)"
  },
  {
    method: "patch",
    path: "/users/:id",
    handlers: [updateUser],
    description: "Patch user (simple demo)"
  },
  { method: "delete", path: "/users/:id", handlers: [deleteUser], description: "Delete a user" }
];

export const exampleSchema: ApiSchema = {
  basePath: "/api/v1",
  routes
};
