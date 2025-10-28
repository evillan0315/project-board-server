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
  CreateMemberDto,
  PaginationMemberResultDto,
  PaginationMemberQueryDto,
} from './dto/create-member.dto';

import { UpdateMemberDto } from './dto/update-member.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';

import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

@Injectable()
export class MemberService {
  private readonly logger = new Logger(MemberService.name);
  constructor(
    private readonly moduleControlService: ModuleControlService,
    private prisma: PrismaService,
    @Inject(REQUEST)
    private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if MemberModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('MemberModule')) {
      this.logger.warn(
        'MemberModule is currently disabled via ModuleControlService. Member operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('MemberModule')) {
      throw new ForbiddenException(
        'Member module is currently disabled. Cannot perform Member operations.',
      );
    }
  }

  private get userId(): string | undefined {
    return this.request.user?.id;
  }

  create(data: CreateMemberDto) {
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

    return this.prisma.member.create({ data: createData });
  }

  async findAllPaginated(
    query: PaginationMemberQueryDto,
    select?: Prisma.MemberSelect,
  ) {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = this.buildWhereFromQuery(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.member.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        ...(select ? { select } : {}),
      }),
      this.prisma.member.count({ where }),
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
    return this.prisma.member.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.member.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateMemberDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.member.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.member.delete({ where: { id } });
  }

  private buildWhereFromQuery(
    query: PaginationMemberQueryDto,
  ): Prisma.MemberWhereInput {
    const where: Prisma.MemberWhereInput = {
      createdById: this.userId,
    };

    if (query.username !== undefined) {
      where.username = query.username;
    }
    if (query.email !== undefined) {
      where.email = query.email;
    }
    if (query.provider !== undefined) {
      where.provider = query.provider;
    }
    if (query.confirmed !== undefined) {
      where.confirmed = query.confirmed;
    }
    if (query.blocked !== undefined) {
      where.blocked = query.blocked;
    }
    if (query.role !== undefined) {
      where.role = query.role;
    }
    if (query.memberSystemId !== undefined) {
      where.memberSystemId = query.memberSystemId;
    }
    if (query.jsonData !== undefined) {
      where.jsonData = query.jsonData;
    }
    if (query.blockedExpire !== undefined) {
      where.blockedExpire = query.blockedExpire;
    }
    if (query.blockedStart !== undefined) {
      where.blockedStart = query.blockedStart;
    }
    if (query.isPaid !== undefined) {
      where.isPaid = query.isPaid;
    }
    if (query.createGroup !== undefined) {
      where.createGroup = query.createGroup;
    }
    if (query.isEmployee !== undefined) {
      where.isEmployee = query.isEmployee;
    }
    if (query.isOnline !== undefined) {
      where.isOnline = query.isOnline;
    }
    if (query.memberType !== undefined) {
      where.memberType = query.memberType;
    }
    if (query.picture !== undefined) {
      where.picture = query.picture;
    }
    if (query.adminUser !== undefined) {
      where.adminUser = query.adminUser;
    }
    if (query.latString !== undefined) {
      where.latString = query.latString;
    }
    if (query.lonString !== undefined) {
      where.lonString = query.lonString;
    }
    if (query.userSetting !== undefined) {
      where.userSetting = query.userSetting;
    }
    if (query.terms !== undefined) {
      where.terms = query.terms;
    }

    return where;
  }
}
