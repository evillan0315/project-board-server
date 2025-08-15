import { applyDecorators, SetMetadata } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) =>
  applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    ApiBearerAuth(), // for bearer token
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiForbiddenResponse({ description: 'Forbidden - insufficient role' }),
  );
