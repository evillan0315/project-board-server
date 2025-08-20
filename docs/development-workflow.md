# Development Workflow

This document outlines the recommended development workflow for working with the full-stack monorepo project.

## Monorepo Management with pnpm workspaces

This project is structured as a monorepo using `pnpm workspaces`. This means:

- **Shared Dependencies**: Common dependencies across applications are hoisted to the root `node_modules`, saving disk space and installation time.
- **Inter-package Dependencies**: Packages within the monorepo can depend on each other by simply listing them in `package.json`, and `pnpm` will link them correctly.
- **Consistent Tooling**: Commands can be run across all packages or specific packages using `pnpm -r <command>` or `pnpm --filter <package-name> <command>`.

### Useful pnpm Commands

- `pnpm install`: Install dependencies for all workspaces.
- `pnpm add <package-name> --filter <workspace-name>`: Add a dependency to a specific workspace.
- `pnpm run <script-name>`: Run a script defined in the root `package.json`.
- `pnpm --filter <workspace-name> run <script-name>`: Run a script defined in a specific workspace's `package.json`.
- `pnpm recursive run <script-name>`: Run a script in all workspaces that have it.

## Setting Up Your Development Environment

1.  **Follow the [Getting Started](getting-started.md) guide:** Ensure you have all prerequisites installed and the project is runnable.
2.  **IDE Setup**:
    - **VS Code (Recommended)**: Install extensions like ESLint, Prettier, Prisma, and a good TypeScript extension.
    - Ensure your IDE respects the `.prettierrc` and `eslint.config.ts` files for consistent code style.

## Backend Development (NestJS - `src/`)

The backend is built with NestJS, a progressive Node.js framework for building efficient, reliable, and scalable server-side applications.

- **Start the Backend**:

  ```bash
  pnpm run start:dev
  ```

  This will start the NestJS application in watch mode, automatically recompiling and restarting on file changes.

- **API Endpoints**: The backend defines various API endpoints. You can explore them via Swagger UI, typically available at `http://localhost:3000/api` (assuming default port).

- **Database Migrations**:
  When making changes to the Prisma schema (`prisma/schema.prisma`), remember to generate and apply migrations:

  ```bash
  pnpm prisma migrate dev --name <migration-name>
  ```

- **Testing**:
  Run backend tests:
  ```bash
  pnpm test # Unit and E2E tests for the backend
  ```

## Frontend Development

Each frontend application is a separate Vite/React project within the monorepo.

### Main Frontend (Dashboard) (`frontend/`)

- **Start Development Server**:

  ```bash
  cd frontend
  pnpm run dev
  ```

  This will typically start the development server on `http://localhost:5173`.

- **Component Structure**: Components are organized logically within `src/components/` (e.g., `apps/`, `editor/`, `layouts/`, `ui/`).
- **State Management**: NanoStores (or similar) is used for lightweight global state.
- **Styling**: Tailwind CSS is used for utility-first styling.

### Code Editor (`code-editor/`)

- **Start Development Server**:

  ```bash
  cd code-editor
  pnpm run dev
  ```

  This will typically start the development server on `http://localhost:5174`.

- **Key Libraries**: CodeMirror for editor functionality, Xterm.js for the terminal.
- **WebSockets**: Real-time communication with the backend for file synchronization, terminal output, and AI chat.

### Other Apps (`apps/ai-editor-front`, `apps/point-of-sale`)

Navigate to their respective directories and run `pnpm run dev` to start their development servers.

## Code Style and Quality

- **ESLint**: Used for static code analysis. Configuration files (`.eslintrc.cjs`, `eslint.config.ts`) are located at the root and within individual applications.
  - Run linting: `pnpm lint` (or `pnpm --filter <package> lint`)
  - Fix linting issues: `pnpm lint --fix`

- **Prettier**: Used for code formatting. The configuration is at `.prettierrc`.
  - Run formatting: `pnpm format` (or `pnpm --filter <package> format`)

- **Type Checking**: TypeScript is used extensively. Ensure your IDE is configured to show TypeScript errors, or run:
  ```bash
  pnpm typecheck # or pnpm --filter <package> typecheck
  ```

## Adding New Features / Modules

When adding a new feature:

1.  **Backend**:
    - Create a new module (e.g., `src/new-feature/`).
    - Define DTOs, services, controllers, and potentially Prisma models.
    - Run `pnpm prisma migrate dev` if you modify the database schema.
    - Consider adding API documentation via Swagger decorators.

2.  **Frontend**:
    - Create new components and pages in the relevant frontend application (e.g., `frontend/src/pages/`, `frontend/src/components/`).
    - Integrate with the backend APIs using the provided services (e.g., `frontend/src/services/api.ts`).
    - Ensure routing is correctly configured.

3.  **Code Generation Tools**:
    The `libs/generator.ts` and `libs/templates/` suggest that there might be scaffolding tools available for generating new backend modules (controllers, services, DTOs). Explore these scripts to streamline new module creation.

## Debugging

- **Backend**: Use your IDE's debugger (e.g., VS Code's Node.js debugger) attached to the `start:dev` process.
- **Frontend**: Use browser developer tools for debugging React components, network requests, and CSS issues.
- **Logs**: Check the `logs/` directory at the root for combined and error logs from the backend.
