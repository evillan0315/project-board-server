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
  CreateFavoriteSongDto,
  PaginationFavoriteSongResultDto,
  PaginationFavoriteSongQueryDto,
} from './dto/create-favorite-song.dto';

import { UpdateFavoriteSongDto } from './dto/update-favorite-song.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class FavoriteSongService {
  private readonly logger = new Logger(FavoriteSongService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if FavoriteSongModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('FavoriteSongModule')) {
      this.logger.warn(
        'FavoriteSongModule is currently disabled via ModuleControlService. FavoriteSong operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('FavoriteSongModule')) {
      throw new ForbiddenException(
        'FavoriteSong module is currently disabled. Cannot perform FavoriteSong operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreateFavoriteSongDto) {
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

    return this.prisma.favoriteSong.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationFavoriteSongQueryDto,
    select?: Prisma.FavoriteSongSelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.favoriteSong.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.favoriteSong.count({ where }),
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
    return this.prisma.favoriteSong.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.favoriteSong.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateFavoriteSongDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.favoriteSong.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.favoriteSong.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationFavoriteSongQueryDto,
  ): Prisma.FavoriteSongWhereInput {
    const where: Prisma.FavoriteSongWhereInput = {
      createdById: this.userId,
    };

    if (query.songId !== undefined) {
      where.songId = query.songId;
    }

    return where;
  }
}
