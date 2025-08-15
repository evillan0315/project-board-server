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
  CreateSchemaDto,
  PaginationSchemaResultDto,
  PaginationSchemaQueryDto,
} from './dto/create-schema.dto';

import { UpdateSchemaDto } from './dto/update-schema.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class SchemaService {
  private readonly logger = new Logger(SchemaService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if SchemaModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('SchemaModule')) {
      this.logger.warn(
        'SchemaModule is currently disabled via ModuleControlService. Schema operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('SchemaModule')) {
      throw new ForbiddenException(
        'Schema module is currently disabled. Cannot perform Schema operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreateSchemaDto) {
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

    return this.prisma.schema.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationSchemaQueryDto,
    select?: Prisma.SchemaSelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.schema.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.schema.count({ where }),
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
    return this.prisma.schema.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.schema.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateSchemaDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.schema.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.schema.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationSchemaQueryDto,
  ): Prisma.SchemaWhereInput {
    const where: Prisma.SchemaWhereInput = {};

    if (query.name !== undefined) {
      where.name = query.name;
    }
    if (query.schema !== undefined) {
      where.schema = query.schema;
    }

    return where;
  }
}
