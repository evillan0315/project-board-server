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
  CreateCommandHistoryDto,
  PaginationCommandHistoryResultDto,
  PaginationCommandHistoryQueryDto,
} from './dto/create-command-history.dto';

import { UpdateCommandHistoryDto } from './dto/update-command-history.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class CommandHistoryService {
  private readonly logger = new Logger(CommandHistoryService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if CommandHistoryModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('CommandHistoryModule')) {
      this.logger.warn(
        'CommandHistoryModule is currently disabled via ModuleControlService. CommandHistory operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('CommandHistoryModule')) {
      throw new ForbiddenException(
        'CommandHistory module is currently disabled. Cannot perform CommandHistory operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreateCommandHistoryDto) {
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

    return this.prisma.commandHistory.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationCommandHistoryQueryDto,
    select?: Prisma.CommandHistorySelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.commandHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.commandHistory.count({ where }),
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
    return this.prisma.commandHistory.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.commandHistory.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateCommandHistoryDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.commandHistory.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.commandHistory.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationCommandHistoryQueryDto,
  ): Prisma.CommandHistoryWhereInput {
    const where: Prisma.CommandHistoryWhereInput = {};

    if (query.command !== undefined) {
      where.command = query.command;
    }
    if (query.executedAt !== undefined) {
      where.executedAt = query.executedAt;
    }
    if (query.status !== undefined) {
      where.status = query.status;
    }
    if (query.exitCode !== undefined) {
      where.exitCode = query.exitCode;
    }
    if (query.output !== undefined) {
      where.output = query.output;
    }
    if (query.errorOutput !== undefined) {
      where.errorOutput = query.errorOutput;
    }
    if (query.workingDirectory !== undefined) {
      where.workingDirectory = query.workingDirectory;
    }
    if (query.durationMs !== undefined) {
      where.durationMs = query.durationMs;
    }
    if (query.shellType !== undefined) {
      where.shellType = query.shellType;
    }
    if (query.terminalSessionId !== undefined) {
      where.terminalSessionId = query.terminalSessionId;
    }

    return where;
  }
}
