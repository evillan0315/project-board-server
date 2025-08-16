import { Logger, Injectable, Inject, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleControlService } from '../module-control/module-control.service';

import {
  CreateTerminalCommandDto,
  PaginationTerminalCommandResultDto,
  PaginationTerminalCommandQueryDto,
} from './dto/create-terminal-command.dto';

import { UpdateTerminalCommandDto } from './dto/update-terminal-command.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';


import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';



@Injectable()
export class TerminalCommandService {
  private readonly logger = new Logger(TerminalCommandService.name);
  constructor(

    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if TerminalCommandModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('TerminalCommandModule')) {
      this.logger.warn(
        'TerminalCommandModule is currently disabled via ModuleControlService. TerminalCommand operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('TerminalCommandModule')) {
      throw new ForbiddenException(
        'TerminalCommand module is currently disabled. Cannot perform TerminalCommand operations.',
      );
    }
  }


  private get userId(): string | undefined {
  return this.request.user?.id;
}


  create(data: CreateTerminalCommandDto) {
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


    return this.prisma.terminalCommand.create({ data: createData });
  }

  async findAllPaginated(
  query: PaginationTerminalCommandQueryDto,
  select?: Prisma.TerminalCommandSelect,
) {
  const page = query.page ? Number(query.page) : 1;
  const pageSize = query.pageSize ? Number(query.pageSize) : 10;
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const where = this.buildWhereFromQuery(query);

  const [items, total] = await this.prisma.$transaction([
    this.prisma.terminalCommand.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      ...(select ? { select } : {}),
    }),
    this.prisma.terminalCommand.count({ where }),
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
    return this.prisma.terminalCommand.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.terminalCommand.findUnique(

    { where: { id } }

    );
  }

  update(id: string, data: UpdateTerminalCommandDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.terminalCommand.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.terminalCommand.delete({ where: { id } });
  }


  private buildWhereFromQuery(query: PaginationTerminalCommandQueryDto): Prisma.TerminalCommandWhereInput {
    const where: Prisma.TerminalCommandWhereInput = {};

    if (query.command !== undefined) {
      where.command = query.command;
    }
    if (query.description !== undefined) {
      where.description = query.description;
    }
    if (query.output !== undefined) {
      where.output = query.output;
    }
    if (query.tags !== undefined && Array.isArray(query.tags)) {
      // FIX: Use Prisma's 'hasSome' operator for array filtering.
      // This will find records where the 'tags' array contains at least one of the tags provided in query.tags.
      where.tags = {
        hasSome: query.tags,
      };
    }
    if (query.isFavorite !== undefined) {
      where.isFavorite = query.isFavorite;
    }

    return where;
  }
}
