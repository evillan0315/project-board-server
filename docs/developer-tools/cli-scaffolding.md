## CLI Tool for Module Scaffolding

This project includes a custom Nest CLI scaffolding tool that streamlines the creation of new modules, complete with services, controllers, and Data Transfer Objects (DTOs). This tool is designed to accelerate development by reducing boilerplate and ensuring consistent project structure.

### Usage

To use the CLI tool, execute it from your project root. The command structure typically involves specifying the module name and optionally, the path where it should be created.

```bash
npx nest-cli-plugin generate module <module-name> [options]
```

Replace `<module-name>` with the desired name for your new module (e.g., `feature`).

### Automatic `createdBy` Injection

One of the key features of this scaffolding tool is its intelligent handling of user context for Prisma models.

#### How It Works

If the Prisma model associated with the generated module contains either a `createdBy` or `createdById` field, and the model is **not** `User`, the generated service will:

- Inject the current user from the request (via `REQUEST` from `@nestjs/core`).
- Automatically attach the authenticated user as the creator during creation operations, typically like this:

  ```typescript
  createData.createdBy = {
    connect: { id: this.userId },
  };
  ```

- Automatically remove `createdById` from the DTO to avoid Prisma conflicts if both are present in the incoming data.

#### Requirements

- Your Prisma model must define either:

  ```prisma
  createdBy   User   @relation(fields: [createdById], references: [id])
  createdById String
  ```

  or simply:

  ```prisma
  createdBy   User   @relation(fields: [createdBy], references: [id])
  ```

- The model must not be `User` itself to avoid circular logic during user creation.

#### Protected Models

This functionality works in conjunction with the `libs/protected-models.ts` configuration (or similar internal mechanism), which enables route protection and user context injection across various modules, ensuring that newly scaffolded modules adhere to the application's security and data ownership patterns.
