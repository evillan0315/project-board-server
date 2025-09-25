export enum FileType {
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  CODE = 'CODE',
  TEXT = 'TEXT',
  ZIP = 'ZIP',
  PDF = 'PDF',
  MARKDOWN = 'MARKDOWN',
  YAML = 'YAML',
  JSON = 'JSON',
  JAVASCRIPT = 'JAVASCRIPT',
  TYPESCRIPT = 'TYPESCRIPT',
  JSX = 'JSX',
  TSX = 'TSX',
  CSS = 'CSS',
  HTML = 'HTML',
  SQL = 'SQL',
  PYTHON = 'PYTHON',
  JAVA = 'JAVA',
  XML = 'XML',
  OTHER = 'OTHER',
}

export enum FileAction {
  ADD = 'add',
  MODIFY = 'modify',
  DELETE = 'delete',
  REPAIR = 'repair',
  ANALYZE = 'analyze',
}

export enum LlmOutputFormat {
  JSON = 'json',
  YAML = 'yaml',
  MARKDOWN = 'markdown',
  TEXT = 'text',
}

// Request Types
export enum RequestType {
  TEXT_ONLY = 'TEXT_ONLY',
  TEXT_WITH_IMAGE = 'TEXT_WITH_IMAGE',
  TEXT_WITH_FILE = 'TEXT_WITH_FILE',
  LLM_GENERATION = 'LLM_GENERATION',
  LIVE_API = 'LIVE_API',
  RESUME_GENERATION = 'RESUME_GENERATION',
  RESUME_OPTIMIZATION = 'RESUME_OPTIMIZATION',
  RESUME_ENHANCEMENT = 'RESUME_ENHANCEMENT',
  VIDEO_GENERATION = 'VIDEO_GENERATION',
  IMAGE_GENERATION = 'IMAGE_GENERATION',
}

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  DEVELOPER = 'DEVELOPER',
}
export enum FileTreeType {
  FILE = 'file',
  FOLDER = 'folder',
}
export enum Provider {
  LOCAL = 'local',
  GOOGLE = 'google',
  GITHUB = 'github',
  FACEBOOK = 'facebook',
  LINKEDIN = 'linkedin',
}
