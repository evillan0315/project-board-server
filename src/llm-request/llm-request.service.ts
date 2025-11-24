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
  CreateLlmRequestDto,
  PaginationLlmRequestResultDto,
  PaginationLlmRequestQueryDto,
} from './dto/create-llm-request.dto';

import { UpdateLlmRequestDto } from './dto/update-llm-request.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class LlmRequestService {
  private readonly logger = new Logger(LlmRequestService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if LlmRequestModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('LlmRequestModule')) {
      this.logger.warn(
        'LlmRequestModule is currently disabled via ModuleControlService. LlmRequest operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('LlmRequestModule')) {
      throw new ForbiddenException(
        'LlmRequest module is currently disabled. Cannot perform LlmRequest operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreateLlmRequestDto) {
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

    return this.prisma.llmRequest.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationLlmRequestQueryDto,
    select?: Prisma.LlmRequestSelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.llmRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.llmRequest.count({ where }),
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
    return this.prisma.llmRequest.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.llmRequest.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateLlmRequestDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.llmRequest.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.llmRequest.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationLlmRequestQueryDto,
  ): Prisma.LlmRequestWhereInput {
    const where: Prisma.LlmRequestWhereInput = {
      createdById: this.userId,
    };

    if (query.userPrompt !== undefined) {
      where.userPrompt = query.userPrompt;
    }
    if (query.projectRoot !== undefined) {
      where.projectRoot = query.projectRoot;
    }
    if (query.scanPaths !== undefined) {
      where.scanPaths = {
        hasSome: query.scanPaths,
      };
    }
    if (query.additionalInstructions !== undefined) {
      where.additionalInstructions = query.additionalInstructions;
    }
    if (query.expectedOutputFormat !== undefined) {
      where.expectedOutputFormat = query.expectedOutputFormat;
    }
    if (query.schemaId !== undefined) {
      where.schemaId = query.schemaId;
    }
    if (query.schemaVersion !== undefined) {
      where.schemaVersion = query.schemaVersion;
    }

    return where;
  }
}
