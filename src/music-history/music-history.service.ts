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
  CreateMusicHistoryDto,
  PaginationMusicHistoryResultDto,
  PaginationMusicHistoryQueryDto,
} from './dto/create-music-history.dto';

import { UpdateMusicHistoryDto } from './dto/update-music-history.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class MusicHistoryService {
  private readonly logger = new Logger(MusicHistoryService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if MusicHistoryModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('MusicHistoryModule')) {
      this.logger.warn(
        'MusicHistoryModule is currently disabled via ModuleControlService. MusicHistory operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('MusicHistoryModule')) {
      throw new ForbiddenException(
        'MusicHistory module is currently disabled. Cannot perform MusicHistory operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreateMusicHistoryDto) {
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

    return this.prisma.musicHistory.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationMusicHistoryQueryDto,
    select?: Prisma.MusicHistorySelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.musicHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.musicHistory.count({ where }),
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
    return this.prisma.musicHistory.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.musicHistory.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateMusicHistoryDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.musicHistory.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.musicHistory.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationMusicHistoryQueryDto,
  ): Prisma.MusicHistoryWhereInput {
    const where: Prisma.MusicHistoryWhereInput = {
      createdById: this.userId,
    };

    if (query.playedAt !== undefined) {
      where.playedAt = query.playedAt;
    }
    if (query.progress !== undefined) {
      where.progress = query.progress;
    }
    if (query.songId !== undefined) {
      where.songId = query.songId;
    }

    return where;
  }
}
