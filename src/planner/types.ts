import { FileAction as PrismaFileAction } from '@prisma/client';
import { LlmInputDto } from '@/llm/dto/llm-input.dto';

// Redefined to use Prisma's FileAction enum directly
export type FileAction = PrismaFileAction;

export interface FileChangeDto {
  filePath: string;
  action: FileAction;
  newContent?: string;
  diff?: string;
  reason?: string;
}

/**
 * Represents a fully persisted plan entity, including database-managed fields.
 * This is the structure returned by `PlannerService.getPlan`.
 */
export interface PlanDto {
  id: string; // Database ID
  title: string;
  summary?: string;
  thoughtProcess?: string;
  documentation?: string; // This will hold the content of the linked Documentation entity
  documentationId?: string; // ID of the linked Documentation entity
  gitInstructions?: string[];
  llmRequest?: { id: string }; // Optional: basic info about linked LLMRequest
  llmRequestId?: string;
  llmInput?: LlmInputDto; // Stored as JSON in Prisma, mapped to DTO here
  createdAt: Date;
  updatedAt?: Date;
  lastExecutionStatus?: string;
  lastExecutionError?: string;
  lastExecutionTimestamp?: Date;
  createdById?: string; // ID of the User who created the plan
  changes: FileChangeDto[];
}
