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
  CreateTerminalSessionDto,
  PaginationTerminalSessionResultDto,
  PaginationTerminalSessionQueryDto,
} from './dto/create-terminal-session.dto';

import { UpdateTerminalSessionDto } from './dto/update-terminal-session.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class TerminalSessionService {
  private readonly logger = new Logger(TerminalSessionService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if TerminalSessionModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('TerminalSessionModule')) {
      this.logger.warn(
        'TerminalSessionModule is currently disabled via ModuleControlService. TerminalSession operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('TerminalSessionModule')) {
      throw new ForbiddenException(
        'TerminalSession module is currently disabled. Cannot perform TerminalSession operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreateTerminalSessionDto) {
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

    return this.prisma.terminalSession.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationTerminalSessionQueryDto,
    select?: Prisma.TerminalSessionSelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.terminalSession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.terminalSession.count({ where }),
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
    return this.prisma.terminalSession.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.terminalSession.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateTerminalSessionDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.terminalSession.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.terminalSession.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationTerminalSessionQueryDto,
  ): Prisma.TerminalSessionWhereInput {
    const where: Prisma.TerminalSessionWhereInput = {
      createdById: this.userId,
    };

    if (query.name !== undefined) {
      where.name = query.name;
    }
    if (query.startedAt !== undefined) {
      where.startedAt = query.startedAt;
    }
    if (query.endedAt !== undefined) {
      where.endedAt = query.endedAt;
    }
    if (query.ipAddress !== undefined) {
      where.ipAddress = query.ipAddress;
    }
    if (query.userAgent !== undefined) {
      where.userAgent = query.userAgent;
    }
    if (query.clientInfo !== undefined) {
      where.clientInfo = query.clientInfo;
    }

    return where;
  }
}
