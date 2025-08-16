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
  CreateSystemInstructionDto,
  PaginationSystemInstructionResultDto,
  PaginationSystemInstructionQueryDto,
} from './dto/create-system-instruction.dto';

import { UpdateSystemInstructionDto } from './dto/update-system-instruction.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class SystemInstructionService {
  private readonly logger = new Logger(SystemInstructionService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if SystemInstructionModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('SystemInstructionModule')) {
      this.logger.warn(
        'SystemInstructionModule is currently disabled via ModuleControlService. SystemInstruction operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('SystemInstructionModule')) {
      throw new ForbiddenException(
        'SystemInstruction module is currently disabled. Cannot perform SystemInstruction operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreateSystemInstructionDto) {
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

    return this.prisma.systemInstruction.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationSystemInstructionQueryDto,
    select?: Prisma.SystemInstructionSelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.systemInstruction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.systemInstruction.count({ where }),
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
    return this.prisma.systemInstruction.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.systemInstruction.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateSystemInstructionDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.systemInstruction.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.systemInstruction.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationSystemInstructionQueryDto,
  ): Prisma.SystemInstructionWhereInput {
    const where: Prisma.SystemInstructionWhereInput = {};

    if (query.requestId !== undefined) {
      where.requestId = query.requestId;
    }
    if (query.instruction !== undefined) {
      where.instruction = query.instruction;
    }
    if (query.persona !== undefined) {
      where.persona = query.persona;
    }

    return where;
  }
}
