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
  CreateSchemaSubmissionDto,
  PaginationSchemaSubmissionResultDto,
  PaginationSchemaSubmissionQueryDto,
} from './dto/create-schema-submission.dto';

import { UpdateSchemaSubmissionDto } from './dto/update-schema-submission.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class SchemaSubmissionService {
  private readonly logger = new Logger(SchemaSubmissionService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if SchemaSubmissionModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('SchemaSubmissionModule')) {
      this.logger.warn(
        'SchemaSubmissionModule is currently disabled via ModuleControlService. SchemaSubmission operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('SchemaSubmissionModule')) {
      throw new ForbiddenException(
        'SchemaSubmission module is currently disabled. Cannot perform SchemaSubmission operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreateSchemaSubmissionDto) {
    this.ensureFileModuleEnabled();
    let createData: any = { ...data };

    if (this.userId) {
      createData.submittedBy = {
        connect: { id: this.userId },
      };
      delete createData.submittedById;
    }

    return this.prisma.schemaSubmission.create({ data: createData });
  }
  async findBySchemaAndUser(schemaId: string, submittedById: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.schemaSubmission.findMany({
      where: {
        schemaId,
        submittedById,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAllPaginated(
    query: PaginationSchemaSubmissionQueryDto,
    select?: Prisma.SchemaSubmissionSelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.schemaSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.schemaSubmission.count({ where }),
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
    return this.prisma.schemaSubmission.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.schemaSubmission.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateSchemaSubmissionDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.schemaSubmission.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.schemaSubmission.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationSchemaSubmissionQueryDto,
  ): Prisma.SchemaSubmissionWhereInput {
    const where: Prisma.SchemaSubmissionWhereInput = {};

    if (query.schemaName !== undefined) {
      where.schemaName = query.schemaName;
    }
    if (query.submittedById !== undefined) {
      where.submittedById = query.submittedById;
    }
    if (query.data !== undefined) {
      where.data = query.data;
    }
    if (query.schemaId !== undefined) {
      where.schemaId = query.schemaId;
    }

    return where;
  }
}
