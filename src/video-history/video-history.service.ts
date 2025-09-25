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
  CreateVideoHistoryDto,
  PaginationVideoHistoryResultDto,
  PaginationVideoHistoryQueryDto,
} from './dto/create-video-history.dto';

import { UpdateVideoHistoryDto } from './dto/update-video-history.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class VideoHistoryService {
  private readonly logger = new Logger(VideoHistoryService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if VideoHistoryModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('VideoHistoryModule')) {
      this.logger.warn(
        'VideoHistoryModule is currently disabled via ModuleControlService. VideoHistory operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('VideoHistoryModule')) {
      throw new ForbiddenException(
        'VideoHistory module is currently disabled. Cannot perform VideoHistory operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreateVideoHistoryDto) {
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

    return this.prisma.videoHistory.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationVideoHistoryQueryDto,
    select?: Prisma.VideoHistorySelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.videoHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.videoHistory.count({ where }),
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
    return this.prisma.videoHistory.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.videoHistory.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateVideoHistoryDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.videoHistory.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.videoHistory.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationVideoHistoryQueryDto,
  ): Prisma.VideoHistoryWhereInput {
    const where: Prisma.VideoHistoryWhereInput = {
      createdById: this.userId,
    };

    if (query.playedAt !== undefined) {
      where.playedAt = query.playedAt;
    }
    if (query.progress !== undefined) {
      where.progress = query.progress;
    }
    if (query.videoId !== undefined) {
      where.videoId = query.videoId;
    }

    return where;
  }
}
