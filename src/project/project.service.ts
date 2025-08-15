import {
  Logger,
  Injectable,
  Inject,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleControlService } from '../module-control/module-control.service';

import {
  CreateProjectDto,
  PaginationProjectResultDto,
  PaginationProjectQueryDto,
} from './dto/create-project.dto';

import { UpdateProjectDto } from './dto/update-project.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if ProjectModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('ProjectModule')) {
      this.logger.warn(
        'ProjectModule is currently disabled via ModuleControlService. Project operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('ProjectModule')) {
      throw new ForbiddenException(
        'Project module is currently disabled. Cannot perform Project operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreateProjectDto) {
    this.ensureFileModuleEnabled();
    const createData: any = { ...data };

    const hasCreatedById = data.hasOwnProperty('createdById');
    if (this.userId) {
      createData.createdBy = {
        connect: { id: this.userId },
      };
      if (hasCreatedById) {
        delete createData.createdById;
      }
    }

    return this.prisma.project.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationProjectQueryDto,
    select?: Prisma.ProjectSelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  findAll() {
    this.ensureFileModuleEnabled();
    return this.prisma.project.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.project.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateProjectDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationProjectQueryDto,
  ): Prisma.ProjectWhereInput {
    const where: Prisma.ProjectWhereInput = {};

    if (query.name !== undefined) {
      where.name = query.name;
    }
    if (query.description !== undefined) {
      where.description = query.description;
    }

    return where;
  }
}
