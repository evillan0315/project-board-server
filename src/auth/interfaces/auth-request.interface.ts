import { Request } from 'express';
import { User } from '@prisma/client';

export interface AuthRequest extends Request {
  user: Partial<Pick<User, 'id' | 'email' | 'name' | 'role' | 'username'>>;
  provider?: 'github' | 'google';
  providerToken?: string;
}
