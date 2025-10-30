import { PrismaClient, FileAction, Role } from '@prisma/client';

export type { FileAction, Role };

export class PrismaService extends PrismaClient {
  constructor() {
    super();
  }
}
