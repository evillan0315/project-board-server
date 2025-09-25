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
  CreatePlaylistDto,
  PaginationPlaylistResultDto,
  PaginationPlaylistQueryDto,
} from './dto/create-playlist.dto';

import { UpdatePlaylistDto } from './dto/update-playlist.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class PlaylistService {
  private readonly logger = new Logger(PlaylistService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if PlaylistModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('PlaylistModule')) {
      this.logger.warn(
        'PlaylistModule is currently disabled via ModuleControlService. Playlist operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('PlaylistModule')) {
      throw new ForbiddenException(
        'Playlist module is currently disabled. Cannot perform Playlist operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreatePlaylistDto) {
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

    return this.prisma.playlist.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationPlaylistQueryDto,
    select?: Prisma.PlaylistSelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.playlist.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { playlistMediaFiles: { include: { file: true } } },
        ...(select ? { select } : {}),
      }),
      this.prisma.playlist.count({ where }),
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
    return this.prisma.playlist.findMany({
      where: { createdById: this.userId },
      orderBy: { createdAt: 'desc' },
      include: { playlistMediaFiles: true },
    });
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.playlist.findUnique({ where: { id } });
  }

  update(id: string, data: UpdatePlaylistDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.playlist.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.playlist.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationPlaylistQueryDto,
  ): Prisma.PlaylistWhereInput {
    const where: Prisma.PlaylistWhereInput = {
      createdById: this.userId,
    };

    if (query.name !== undefined) {
      where.name = query.name;
    }
    if (query.description !== undefined) {
      where.description = query.description;
    }
    if (query.isPublic !== undefined) {
      where.isPublic = query.isPublic;
    }

    return where;
  }
}
