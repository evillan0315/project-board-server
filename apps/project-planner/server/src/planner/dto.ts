import { FileAction as PrismaFileAction } from '../prisma/prisma.service';

export interface FileChangeDto {
  filePath: string;
  action: PrismaFileAction;
  newContent?: string;
  diff?: string;
  reason?: string;
}

export interface CreatePlannerDto {
  title: string;
  summary: string;
  thoughtProcess?: string;
  changes: FileChangeDto[];
}

export interface UpdatePlannerDto extends CreatePlannerDto {}

export interface LlmInputDto {
  userPrompt: string;
  projectStructure?: string;
  relevantFiles?: ScannedFileDto[];
  additionalInstructions?: string;
  expectedOutputFormat: string;
}

export interface ScannedFileDto {
  relativePath: string;
  content: string;
  language?: string;
}
