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
  CreateMetadataDto,
  PaginationMetadataResultDto,
  PaginationMetadataQueryDto,
} from './dto/create-metadata.dto';

import { UpdateMetadataDto } from './dto/update-metadata.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if MetadataModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('MetadataModule')) {
      this.logger.warn(
        'MetadataModule is currently disabled via ModuleControlService. Metadata operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('MetadataModule')) {
      throw new ForbiddenException(
        'Metadata module is currently disabled. Cannot perform Metadata operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreateMetadataDto) {
    this.ensureFileModuleEnabled();
    let createData: any = { ...data };

    const hasCreatedById = data.hasOwnProperty('createdById');
    if (this.userId) {
      createData.createdBy = {
        connect: { id: this.userId },
      };
      if (hasCreatedById) {
        delete createData.createdById;
      }
    }

    return this.prisma.metadata.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationMetadataQueryDto,
    select?: Prisma.MetadataSelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.metadata.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.metadata.count({ where }),
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
    return this.prisma.metadata.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.metadata.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateMetadataDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.metadata.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.metadata.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationMetadataQueryDto,
  ): Prisma.MetadataWhereInput {
    const where: Prisma.MetadataWhereInput = {
      createdById: this.userId,
    };

    if (query.data !== undefined) {
      where.data = query.data;
    }
    if (query.tags !== undefined) {
      where.tags = {
        hasSome: query.tags,
      };
    }
    if (query.fileId !== undefined) {
      where.fileId = query.fileId;
    }

    return where;
  }
}
