// FilePath: src/common/constants/file-action-map.ts
// Title: Map Prisma enum values to custom string labels
// Reason: Provide lower-case labels for API responses

import { FileAction } from '@prisma/client';

export const FileActionLabel: Record<FileAction, string> = {
  [FileAction.ADD]: 'add',
  [FileAction.MODIFY]: 'modify',
  [FileAction.DELETE]: 'delete',
  [FileAction.REPAIR]: 'repair',
  [FileAction.ANALYZE]: 'analyze',
  [FileAction.INSTALL]: 'install',
  [FileAction.RUN]: 'run',
};
