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
  CreateGeminiRequestDto,
  PaginationGeminiRequestResultDto,
  PaginationGeminiRequestQueryDto,
} from './dto/create-gemini-request.dto';

import { UpdateGeminiRequestDto } from './dto/update-gemini-request.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class GeminiRequestService {
  private readonly logger = new Logger(GeminiRequestService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if GeminiRequestModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('GeminiRequestModule')) {
      this.logger.warn(
        'GeminiRequestModule is currently disabled via ModuleControlService. GeminiRequest operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('GeminiRequestModule')) {
      throw new ForbiddenException(
        'GeminiRequest module is currently disabled. Cannot perform GeminiRequest operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreateGeminiRequestDto) {
    this.ensureFileModuleEnabled();
    const createData: any = { ...data };

    return this.prisma.geminiRequest.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationGeminiRequestQueryDto,
    select?: Prisma.GeminiRequestSelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.geminiRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { geminiResponses: true },
        ...(select ? { select } : {}),
      }),
      this.prisma.geminiRequest.count({ where }),
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
    return this.prisma.geminiRequest.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.geminiRequest.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateGeminiRequestDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.geminiRequest.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.geminiRequest.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationGeminiRequestQueryDto,
  ): Prisma.GeminiRequestWhereInput {
    const where: Prisma.GeminiRequestWhereInput = {};

    if (query.userId !== undefined) {
      where.userId = query.userId;
    } else {
      where.userId = this.userId;
    }
    if (query.conversationId !== undefined) {
      where.conversationId = query.conversationId;
    }
    if (query.modelUsed !== undefined) {
      where.modelUsed = query.modelUsed;
    }
    if (query.prompt !== undefined) {
      where.prompt = query.prompt;
    }
    if (query.systemInstruction !== undefined) {
      where.systemInstruction = query.systemInstruction;
    }
    if (query.imageUrl !== undefined) {
      where.imageUrl = query.imageUrl;
    }
    if (query.imageData !== undefined) {
      where.imageData = query.imageData;
    }
    if (query.fileMimeType !== undefined) {
      where.fileMimeType = query.fileMimeType;
    }
    if (query.fileData !== undefined) {
      where.fileData = query.fileData;
    }

    return where;
  }
}
