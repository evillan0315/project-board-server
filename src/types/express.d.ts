import { User } from '@prisma/client';

// src/types/express.d.ts (Create this file if it doesn't exist)
declare namespace Express {
  interface Request {
    user?: User;
  }
}

