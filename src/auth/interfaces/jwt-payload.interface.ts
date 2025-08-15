import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string; // user.id is a string
  email: string; // user.email is a string
  role: Role; // assign a fallback elsewhere, not in the type
  name?: string; // optional
  provider?: 'google' | 'github'; // optional
}
