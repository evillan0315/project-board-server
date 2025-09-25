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
  CreateArtistDto,
  PaginationArtistResultDto,
  PaginationArtistQueryDto,
} from './dto/create-artist.dto';

import { UpdateArtistDto } from './dto/update-artist.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class ArtistService {
  private readonly logger = new Logger(ArtistService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if ArtistModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('ArtistModule')) {
      this.logger.warn(
        'ArtistModule is currently disabled via ModuleControlService. Artist operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('ArtistModule')) {
      throw new ForbiddenException(
        'Artist module is currently disabled. Cannot perform Artist operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreateArtistDto) {
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

    return this.prisma.artist.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationArtistQueryDto,
    select?: Prisma.ArtistSelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.artist.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.artist.count({ where }),
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
    return this.prisma.artist.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.artist.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateArtistDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.artist.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.artist.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationArtistQueryDto,
  ): Prisma.ArtistWhereInput {
    const where: Prisma.ArtistWhereInput = {
      createdById: this.userId,
    };

    if (query.name !== undefined) {
      where.name = query.name;
    }
    if (query.bio !== undefined) {
      where.bio = query.bio;
    }
    if (query.image !== undefined) {
      where.image = query.image;
    }

    return where;
  }
}
