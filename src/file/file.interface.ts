export interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  type: 'file' | 'folder';
  lang?: string;
  mimeType?: string;
  size?: number;
  createdAt?: Date;
  updatedAt?: Date;
  children: FileTreeNode[];
}

export interface ScannedFile {
  filePath: string; // Absolute path to the file
  relativePath: string; // Path relative to the project root (e.g., "src/components/MyComponent.tsx")
  content: string;
}