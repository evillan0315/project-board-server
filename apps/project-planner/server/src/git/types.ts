export interface StatusResultFile {
  path: string;
  index: string;
  working_dir: string;
}

export interface RenamedFile {
  from: string;
  to: string;
}

export interface GitStatusResult {
  current: string | null;
  detached: boolean;
  files: StatusResultFile[];
  not_added: string[];
  conflicted: string[];
  created: string[];
  deleted: string[];
  modified: string[];
  renamed: RenamedFile[];
  staged: string[];
  ahead: number;
  behind: number;
  tracking: string | null;
  is_clean: boolean;
}

export interface GitBranch {
  name: string;
  current: boolean;
  commit: string;
  label: string;
}

export interface GitCommit {
  hash: string;
  date: string;
  message: string;
  author_name: string;
  author_email: string;
}
