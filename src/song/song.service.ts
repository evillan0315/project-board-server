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
  CreateSongDto,
  PaginationSongResultDto,
  PaginationSongQueryDto,
} from './dto/create-song.dto';

import { UpdateSongDto } from './dto/update-song.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class SongService {
  private readonly logger = new Logger(SongService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if SongModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('SongModule')) {
      this.logger.warn(
        'SongModule is currently disabled via ModuleControlService. Song operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('SongModule')) {
      throw new ForbiddenException(
        'Song module is currently disabled. Cannot perform Song operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreateSongDto) {
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

    return this.prisma.song.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationSongQueryDto,
    select?: Prisma.SongSelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.song.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.song.count({ where }),
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
    return this.prisma.song.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.song.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateSongDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.song.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.song.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationSongQueryDto,
  ): Prisma.SongWhereInput {
    const where: Prisma.SongWhereInput = {
      createdById: this.userId,
    };

    if (query.title !== undefined) {
      where.title = query.title;
    }
    if (query.duration !== undefined) {
      where.duration = query.duration;
    }
    if (query.year !== undefined) {
      where.year = query.year;
    }
    if (query.artistId !== undefined) {
      where.artistId = query.artistId;
    }
    if (query.albumId !== undefined) {
      where.albumId = query.albumId;
    }

    return where;
  }
}
