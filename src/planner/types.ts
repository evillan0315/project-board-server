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
  planId?: string; // Added for persistence
  title: string;
  summary?: string; // Made optional
  thoughtProcess?: string;
  documentation?: string;
  gitInstructions?: string[];
  changes: FileChangeDto[];
}