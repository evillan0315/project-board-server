import { IsString, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdById?: string; // Optional, if linked to a user
}

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
}

export interface PaginationProjectResultDto {
  items: Project[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationProjectQueryDto {
  page?: number;
  pageSize?: number;
  name?: string;
  description?: string;
}
