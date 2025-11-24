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
  CreatePlanDto,
  PaginationPlanResultDto,
  PaginationPlanQueryDto,
} from './dto/create-plan.dto';

import { UpdatePlanDto } from './dto/update-plan.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class PlanService {
  private readonly logger = new Logger(PlanService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if PlanModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('PlanModule')) {
      this.logger.warn(
        'PlanModule is currently disabled via ModuleControlService. Plan operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('PlanModule')) {
      throw new ForbiddenException(
        'Plan module is currently disabled. Cannot perform Plan operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreatePlanDto) {
    this.ensureFileModuleEnabled();
    let createData: any = {
      ...data,
      include: { changes: true, ExecutionSnapshot: true, documentation: true },
    };

    const hasCreatedById = data.hasOwnProperty('createdById');
    if (this.userId) {
      createData.createdBy = {
        connect: { id: this.userId },
      };
      if (hasCreatedById) {
        delete createData.createdById;
      }
    }

    return this.prisma.plan.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationPlanQueryDto,
    select?: Prisma.PlanSelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.plan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
        include: {
          changes: true,
          ExecutionSnapshot: true,
          documentation: true,
        },
      }),
      this.prisma.plan.count({ where }),
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
    return this.prisma.plan.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.plan.findUnique({
      where: { id },
      include: { changes: true, ExecutionSnapshot: true, documentation: true },
    });
  }

  update(id: string, data: UpdatePlanDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.plan.update({
      where: { id },
      data,
      include: { changes: true, ExecutionSnapshot: true, documentation: true },
    });
  }

  remove(id: string) {
    return this.prisma.plan.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationPlanQueryDto,
  ): Prisma.PlanWhereInput {
    const where: Prisma.PlanWhereInput = {
      createdById: this.userId,
    };

    if (query.title !== undefined) {
      where.title = query.title;
    }
    if (query.summary !== undefined) {
      where.summary = query.summary;
    }
    if (query.thoughtProcess !== undefined) {
      where.thoughtProcess = query.thoughtProcess;
    }
    if (query.assumptions !== undefined) {
      where.assumptions = query.assumptions;
    }
    if (query.estimatedEffortMinutes !== undefined) {
      where.estimatedEffortMinutes = query.estimatedEffortMinutes;
    }
    if (query.confidence !== undefined) {
      where.confidence = query.confidence;
    }
    if (query.documentationId !== undefined) {
      where.documentationId = query.documentationId;
    }
    if (query.gitInstructions !== undefined) {
      where.gitInstructions = {
        hasSome: query.gitInstructions,
      };
    }
    if (query.llmRequestId !== undefined) {
      where.llmRequestId = query.llmRequestId;
    }
    if (query.llmInput !== undefined) {
      where.llmInput = query.llmInput;
    }
    if (query.lastExecutionStatus !== undefined) {
      where.lastExecutionStatus = query.lastExecutionStatus;
    }
    if (query.lastExecutionError !== undefined) {
      where.lastExecutionError = query.lastExecutionError;
    }
    if (query.lastExecutionTimestamp !== undefined) {
      where.lastExecutionTimestamp = query.lastExecutionTimestamp;
    }
    if (query.projectRoot !== undefined) {
      where.projectRoot = query.projectRoot;
    }
    if (query.buildScripts !== undefined) {
      where.buildScripts = query.buildScripts;
    }
    if (query.metadata !== undefined) {
      where.metadata = query.metadata;
    }
    if (query.error !== undefined) {
      where.error = query.error;
    }

    return where;
  }
}
