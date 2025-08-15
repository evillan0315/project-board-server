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
  CreateOrganizationDto,
  PaginationOrganizationResultDto,
  PaginationOrganizationQueryDto,
} from './dto/create-organization.dto';

import { UpdateOrganizationDto } from './dto/update-organization.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if OrganizationModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('OrganizationModule')) {
      this.logger.warn(
        'OrganizationModule is currently disabled via ModuleControlService. Organization operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('OrganizationModule')) {
      throw new ForbiddenException(
        'Organization module is currently disabled. Cannot perform Organization operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreateOrganizationDto) {
    this.ensureFileModuleEnabled();
    const createData: any = { ...data };

    const hasCreatedById = data.hasOwnProperty('createdById');
    if (this.userId) {
      createData.createdBy = {
        connect: { id: this.userId },
      };
      if (hasCreatedById) {
        delete createData.createdById;
      }
    }

    return this.prisma.organization.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationOrganizationQueryDto,
    select?: Prisma.OrganizationSelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.organization.count({ where }),
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
    return this.prisma.organization.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.organization.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateOrganizationDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.organization.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationOrganizationQueryDto,
  ): Prisma.OrganizationWhereInput {
    const where: Prisma.OrganizationWhereInput = {};

    if (query.name !== undefined) {
      where.name = query.name;
    }

    return where;
  }
}
