export interface Planner {
    id: string;
    title: string;
    summary: string | null;
    thoughtProcess: string | null;
    createdAt: Date;
    updatedAt: Date;
    createdById: string;
}

export interface FileChange {
    id: string;
    plannerId: string;
    filePath: string;
    action: 'ADD' | 'MODIFY' | 'DELETE' | 'REPAIR' | 'ANALYZE' | 'INSTALL' | 'RUN';
    newContent: string | null;
    diff: string | null;
    reason: string | null;
    createdAt: Date;
    updatedAt: Date;
}
