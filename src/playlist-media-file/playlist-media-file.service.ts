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
  CreatePlaylistMediaFileDto,
  PaginationPlaylistMediaFileResultDto,
  PaginationPlaylistMediaFileQueryDto,
} from './dto/create-playlist-media-file.dto';

import { UpdatePlaylistMediaFileDto } from './dto/update-playlist-media-file.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class PlaylistMediaFileService {
  private readonly logger = new Logger(PlaylistMediaFileService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if PlaylistMediaFileModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('PlaylistMediaFileModule')) {
      this.logger.warn(
        'PlaylistMediaFileModule is currently disabled via ModuleControlService. PlaylistMediaFile operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('PlaylistMediaFileModule')) {
      throw new ForbiddenException(
        'PlaylistMediaFile module is currently disabled. Cannot perform PlaylistMediaFile operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreatePlaylistMediaFileDto) {
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

    return this.prisma.playlistMediaFile.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationPlaylistMediaFileQueryDto,
    select?: Prisma.PlaylistMediaFileSelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.playlistMediaFile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        include: { file: true },
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.playlistMediaFile.count({ where }),
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
    return this.prisma.playlistMediaFile.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.playlistMediaFile.findUnique({ where: { id } });
  }

  update(id: string, data: UpdatePlaylistMediaFileDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.playlistMediaFile.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.playlistMediaFile.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationPlaylistMediaFileQueryDto,
  ): Prisma.PlaylistMediaFileWhereInput {
    const where: Prisma.PlaylistMediaFileWhereInput = {
      createdById: this.userId,
    };

    if (query.playlistId !== undefined) {
      where.playlistId = query.playlistId;
    }
    if (query.fileId !== undefined) {
      where.fileId = query.fileId;
    }
    if (query.order !== undefined) {
      where.order = query.order;
    }

    return where;
  }
}
