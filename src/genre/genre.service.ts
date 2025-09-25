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
  CreateGenreDto,
  PaginationGenreResultDto,
  PaginationGenreQueryDto,
} from './dto/create-genre.dto';

import { UpdateGenreDto } from './dto/update-genre.dto';

import { Prisma } from '@prisma/client';

@Injectable()
export class GenreService {
  private readonly logger = new Logger(GenreService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if GenreModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('GenreModule')) {
      this.logger.warn(
        'GenreModule is currently disabled via ModuleControlService. Genre operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('GenreModule')) {
      throw new ForbiddenException(
        'Genre module is currently disabled. Cannot perform Genre operations.',
      );
    }
  }

  create(data: CreateGenreDto) {
    this.ensureFileModuleEnabled();
    let createData: any = { ...data };

    return this.prisma.genre.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationGenreQueryDto,
    select?: Prisma.GenreSelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.genre.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.genre.count({ where }),
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
    return this.prisma.genre.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.genre.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateGenreDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.genre.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.genre.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationGenreQueryDto,
  ): Prisma.GenreWhereInput {
    const where: Prisma.GenreWhereInput = {};

    if (query.name !== undefined) {
      where.name = query.name;
    }
    if (query.description !== undefined) {
      where.description = query.description;
    }

    return where;
  }
}
