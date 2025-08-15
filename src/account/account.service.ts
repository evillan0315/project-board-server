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
  CreateAccountDto,
  PaginationAccountResultDto,
  PaginationAccountQueryDto,
} from './dto/create-account.dto';

import { UpdateAccountDto } from './dto/update-account.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if AccountModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('AccountModule')) {
      this.logger.warn(
        'AccountModule is currently disabled via ModuleControlService. Account operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('AccountModule')) {
      throw new ForbiddenException(
        'Account module is currently disabled. Cannot perform Account operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreateAccountDto) {
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

    return this.prisma.account.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationAccountQueryDto,
    select?: Prisma.AccountSelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.account.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.account.count({ where }),
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
    return this.prisma.account.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.account.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateAccountDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.account.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.account.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationAccountQueryDto,
  ): Prisma.AccountWhereInput {
    const where: Prisma.AccountWhereInput = {};

    if (query.type !== undefined) {
      where.type = query.type;
    }
    if (query.provider !== undefined) {
      where.provider = query.provider;
    }
    if (query.providerAccountId !== undefined) {
      where.providerAccountId = query.providerAccountId;
    }
    if (query.refresh_token !== undefined) {
      where.refresh_token = query.refresh_token;
    }
    if (query.access_token !== undefined) {
      where.access_token = query.access_token;
    }
    if (query.expires_at !== undefined) {
      where.expires_at = query.expires_at;
    }
    if (query.token_type !== undefined) {
      where.token_type = query.token_type;
    }
    if (query.scope !== undefined) {
      where.scope = query.scope;
    }
    if (query.id_token !== undefined) {
      where.id_token = query.id_token;
    }
    if (query.session_state !== undefined) {
      where.session_state = query.session_state;
    }

    return where;
  }
}
