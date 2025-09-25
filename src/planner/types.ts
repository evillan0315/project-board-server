export type FileAction = 'add' | 'modify' | 'delete';
export interface FileChangeDto {
  filePath: string;
  action: FileAction;
  newContent?: string;
  diff?: string;
  reason?: string;
}

export interface PlanDto {
  title: string;
  summary: string;
  changes: FileChangeDto[];
}
