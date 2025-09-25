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
  CreateVideoDto,
  PaginationVideoResultDto,
  PaginationVideoQueryDto,
} from './dto/create-video.dto';

import { UpdateVideoDto } from './dto/update-video.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if VideoModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('VideoModule')) {
      this.logger.warn(
        'VideoModule is currently disabled via ModuleControlService. Video operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('VideoModule')) {
      throw new ForbiddenException(
        'Video module is currently disabled. Cannot perform Video operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreateVideoDto) {
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

    return this.prisma.video.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationVideoQueryDto,
    select?: Prisma.VideoSelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.video.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.video.count({ where }),
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
    return this.prisma.video.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.video.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateVideoDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.video.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.video.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationVideoQueryDto,
  ): Prisma.VideoWhereInput {
    const where: Prisma.VideoWhereInput = {
      createdById: this.userId,
    };

    if (query.title !== undefined) {
      where.title = query.title;
    }
    if (query.description !== undefined) {
      where.description = query.description;
    }
    if (query.duration !== undefined) {
      where.duration = query.duration;
    }
    if (query.year !== undefined) {
      where.year = query.year;
    }
    if (query.rating !== undefined) {
      where.rating = query.rating;
    }
    if (query.director !== undefined) {
      where.director = query.director;
    }
    if (query.cast !== undefined) {
      where.cast = {
        hasSome: query.cast,
      };
    }
    if (query.resolution !== undefined) {
      where.resolution = query.resolution;
    }

    return where;
  }
}
