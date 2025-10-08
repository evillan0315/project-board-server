// =========================================================================
// Project Management Types
// =========================================================================

export interface Organization {
  id: string;
  name: string;
  createdAt: string; // Assuming string representation of Date from backend
  updatedAt: string;
}

export interface CreateOrganizationDto {
  name: string;
}

export interface UpdateOrganizationDto {
  name?: string;
}

export interface PaginationOrganizationQueryDto {
  page?: number;
  pageSize?: number;
  name?: string;
}

export interface PaginationOrganizationResultDto {
  items: Organization[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  path: string;
  technologies: string[];
  versionControl: string;
  repositoryUrl: string;
  lastOpenedAt: string;
  ownerId: string;
  organizationId: string; // Link to organization
  metadata: any;
  createdAt: string;
  updatedAt: string;
  status: 'backlog' | 'inProgress' | 'completed'; // Add status field
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  path: string;
  technologies: string[];
  versionControl?: string;
  repositoryUrl?: string;
  lastOpenedAt?: string; // Should be Date or ISO string
  ownerId?: string; // The user who owns the project
  organizationId: string; // Required to link to an organization
  metadata?: any;
  status?: 'backlog' | 'inProgress' | 'completed'; // Add status field
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  path?: string;
  technologies?: string[];
  versionControl?: string;
  repositoryUrl?: string;
  lastOpenedAt?: string; // Should be Date or ISO string
  ownerId?: string;
  organizationId?: string;
  metadata?: any;
  status?: 'backlog' | 'inProgress' | 'completed'; // Add status field
}

export interface PaginationProjectQueryDto {
  page?: number;
  pageSize?: number;
  name?: string;
  description?: string;
  path?: string;
  technologies?: string[];
  versionControl?: string;
  repositoryUrl?: string;
  lastOpenedAt?: string; // Should be Date or ISO string
  ownerId?: string;
  organizationId?: string; // Filter by organization
  metadata?: any;
}

export interface PaginationProjectResultDto {
  items: Project[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
