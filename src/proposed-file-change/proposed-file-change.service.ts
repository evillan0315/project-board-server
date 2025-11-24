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
  CreateProposedFileChangeDto,
  PaginationProposedFileChangeResultDto,
  PaginationProposedFileChangeQueryDto,
} from './dto/create-proposed-file-change.dto';

import { UpdateProposedFileChangeDto } from './dto/update-proposed-file-change.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class ProposedFileChangeService {
  private readonly logger = new Logger(ProposedFileChangeService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if ProposedFileChangeModule is disabled on startup
    if (
      !this.moduleControlService.isModuleEnabled('ProposedFileChangeModule')
    ) {
      this.logger.warn(
        'ProposedFileChangeModule is currently disabled via ModuleControlService. ProposedFileChange operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (
      !this.moduleControlService.isModuleEnabled('ProposedFileChangeModule')
    ) {
      throw new ForbiddenException(
        'ProposedFileChange module is currently disabled. Cannot perform ProposedFileChange operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreateProposedFileChangeDto) {
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

    return this.prisma.proposedFileChange.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationProposedFileChangeQueryDto,
    select?: Prisma.ProposedFileChangeSelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.proposedFileChange.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.proposedFileChange.count({ where }),
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
    return this.prisma.proposedFileChange.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.proposedFileChange.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateProposedFileChangeDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.proposedFileChange.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.proposedFileChange.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationProposedFileChangeQueryDto,
  ): Prisma.ProposedFileChangeWhereInput {
    const where: Prisma.ProposedFileChangeWhereInput = {
      createdById: this.userId,
    };

    if (query.filePath !== undefined) {
      where.filePath = query.filePath;
    }
    if (query.newContent !== undefined) {
      where.newContent = query.newContent;
    }
    if (query.reason !== undefined) {
      where.reason = query.reason;
    }
    if (query.responseId !== undefined) {
      where.responseId = query.responseId;
    }

    return where;
  }
}
