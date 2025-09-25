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
  CreateAlbumDto,
  PaginationAlbumResultDto,
  PaginationAlbumQueryDto,
} from './dto/create-album.dto';

import { UpdateAlbumDto } from './dto/update-album.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class AlbumService {
  private readonly logger = new Logger(AlbumService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if AlbumModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('AlbumModule')) {
      this.logger.warn(
        'AlbumModule is currently disabled via ModuleControlService. Album operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('AlbumModule')) {
      throw new ForbiddenException(
        'Album module is currently disabled. Cannot perform Album operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreateAlbumDto) {
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

    return this.prisma.album.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationAlbumQueryDto,
    select?: Prisma.AlbumSelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.album.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.album.count({ where }),
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
    return this.prisma.album.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.album.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateAlbumDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.album.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.album.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationAlbumQueryDto,
  ): Prisma.AlbumWhereInput {
    const where: Prisma.AlbumWhereInput = {
      createdById: this.userId,
    };

    if (query.title !== undefined) {
      where.title = query.title;
    }
    if (query.releaseDate !== undefined) {
      where.releaseDate = query.releaseDate;
    }
    if (query.coverArt !== undefined) {
      where.coverArt = query.coverArt;
    }
    if (query.artistId !== undefined) {
      where.artistId = query.artistId;
    }

    return where;
  }
}
