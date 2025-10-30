import { FileAction as PrismaFileAction } from '@prisma/client';

export type FileAction = 'add' | 'modify' | 'delete' | 'repair' | 'analyze' | 'install' | 'run';

export interface FileChangeDto {
  filePath: string;
  action: PrismaFileAction;
  newContent?: string;
  diff?: string;
  reason?: string;
}

export interface PlanDto {
  title: string;
  summary: string;
  changes: FileChangeDto[];
}
