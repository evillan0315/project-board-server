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
  CreateFavoriteVideoDto,
  PaginationFavoriteVideoResultDto,
  PaginationFavoriteVideoQueryDto,
} from './dto/create-favorite-video.dto';

import { UpdateFavoriteVideoDto } from './dto/update-favorite-video.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class FavoriteVideoService {
  private readonly logger = new Logger(FavoriteVideoService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if FavoriteVideoModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('FavoriteVideoModule')) {
      this.logger.warn(
        'FavoriteVideoModule is currently disabled via ModuleControlService. FavoriteVideo operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('FavoriteVideoModule')) {
      throw new ForbiddenException(
        'FavoriteVideo module is currently disabled. Cannot perform FavoriteVideo operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreateFavoriteVideoDto) {
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

    return this.prisma.favoriteVideo.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationFavoriteVideoQueryDto,
    select?: Prisma.FavoriteVideoSelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.favoriteVideo.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.favoriteVideo.count({ where }),
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
    return this.prisma.favoriteVideo.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.favoriteVideo.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateFavoriteVideoDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.favoriteVideo.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.favoriteVideo.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationFavoriteVideoQueryDto,
  ): Prisma.FavoriteVideoWhereInput {
    const where: Prisma.FavoriteVideoWhereInput = {
      createdById: this.userId,
    };

    if (query.videoId !== undefined) {
      where.videoId = query.videoId;
    }

    return where;
  }
}
