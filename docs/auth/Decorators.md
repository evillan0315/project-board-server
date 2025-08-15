## Custom Decorators

This module provides custom decorators to simplify common tasks related to authentication and authorization in NestJS controllers.

### `@CurrentUser()`

- **Purpose:** A custom parameter decorator that extracts the authenticated user object from the request and injects it directly into a controller method's parameter.
- **Usage:** Typically used in conjunction with authentication guards (e.g., `JwtAuthGuard`). After a guard successfully authenticates a user and attaches the user object to `req.user`, `@CurrentUser()` makes this object easily accessible.
- **Example:**

  ```typescript
  import { Controller, Get, UseGuards } from '@nestjs/common';
  import { JwtAuthGuard } from './auth.guard';
  import { CurrentUser } from './decorators/current-user.decorator';
  import { User } from '@prisma/client'; // Assuming Prisma User type

  @Controller('profile')
  export class ProfileController {
    @UseGuards(JwtAuthGuard)
    @Get()
    getProfile(@CurrentUser() user: User) {
      return `Welcome, ${user.name || user.email}! Your ID is ${user.id}.`;
    }
  }
  ```

### `@Roles(...roles: string[])`

- **Purpose:** A custom method decorator used to specify which user roles are permitted to access a particular route or controller. This decorator sets metadata that is then read by the `RolesGuard`.
- **Usage:** Always used in combination with the `RolesGuard`.
- **Parameters:** Accepts a variadic list of strings, where each string represents a required role (e.g., `'ADMIN'`, `'USER'`, `'MANAGER'` from `UserRole` enum).
- **Example:**

  ```typescript
  import { Controller, Get, UseGuards } from '@nestjs/common';
  import { JwtAuthGuard } from './auth.guard';
  import { RolesGuard } from './guards/roles.guard';
  import { Roles } from './decorators/roles.decorator';
  import { UserRole } from './enums/user-role.enum';

  @Controller('admin')
  @UseGuards(JwtAuthGuard, RolesGuard) // Apply guards at controller level
  export class AdminController {
    @Get('dashboard')
    @Roles(UserRole.ADMIN, UserRole.SUPERADMIN) // Only ADMINs and SUPERADMINs can access
    getAdminDashboard() {
      return 'Admin dashboard data.';
    }

    @Get('public-info')
    // No @Roles decorator means public access (if JwtAuthGuard is not applied at method level)
    // or accessible by any authenticated user if JwtAuthGuard is applied at controller level but no Roles decorator here
    getPublicInfo() {
      return 'Information available to all authenticated users.';
    }
  }
  ```

- **Swagger Integration:** This decorator also applies Swagger annotations (`@ApiBearerAuth`, `@ApiUnauthorizedResponse`, `@ApiForbiddenResponse`) to automatically document the security requirements for the decorated endpoint in the OpenAPI specification.
