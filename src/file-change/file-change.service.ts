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
  CreateFileChangeDto,
  PaginationFileChangeResultDto,
  PaginationFileChangeQueryDto,
} from './dto/create-file-change.dto';

import { UpdateFileChangeDto } from './dto/update-file-change.dto';

import { Prisma } from '@prisma/client';

@Injectable()
export class FileChangeService {
  private readonly logger = new Logger(FileChangeService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if FileChangeModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('FileChangeModule')) {
      this.logger.warn(
        'FileChangeModule is currently disabled via ModuleControlService. FileChange operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('FileChangeModule')) {
      throw new ForbiddenException(
        'FileChange module is currently disabled. Cannot perform FileChange operations.',
      );
    }
  }

  create(data: CreateFileChangeDto) {
    this.ensureFileModuleEnabled();
    let createData: any = { ...data };

    return this.prisma.fileChange.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationFileChangeQueryDto,
    select?: Prisma.FileChangeSelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.fileChange.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.fileChange.count({ where }),
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
    return this.prisma.fileChange.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.fileChange.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateFileChangeDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.fileChange.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.fileChange.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationFileChangeQueryDto,
  ): Prisma.FileChangeWhereInput {
    const where: Prisma.FileChangeWhereInput = {};

    if (query.planId !== undefined) {
      where.planId = query.planId;
    }
    if (query.index !== undefined) {
      where.index = query.index;
    }
    if (query.filePath !== undefined) {
      where.filePath = query.filePath;
    }
    if (query.reason !== undefined) {
      where.reason = query.reason;
    }
    if (query.diff !== undefined) {
      where.diff = query.diff;
    }
    if (query.oldContent !== undefined) {
      where.oldContent = query.oldContent;
    }
    if (query.newContent !== undefined) {
      where.newContent = query.newContent;
    }
    if (query.testsAdded !== undefined) {
      where.testsAdded = {
        hasSome: query.testsAdded,
      };
    }
    if (query.estimatedMinutes !== undefined) {
      where.estimatedMinutes = query.estimatedMinutes;
    }

    return where;
  }
}
