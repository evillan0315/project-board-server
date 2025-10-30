import { Logger, Injectable, Inject, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleControlService } from '../module-control/module-control.service';

import {
  CreateDiffDto,
  PaginationDiffResultDto,
  PaginationDiffQueryDto,
} from './dto/create-diff.dto';

import { UpdateDiffDto } from './dto/update-diff.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';


import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';



@Injectable()
export class DiffService {
  private readonly logger = new Logger(DiffService.name);
  constructor(
    
    private readonly moduleControlService: ModuleControlService, 
    private prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if DiffModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('DiffModule')) {
      this.logger.warn(
        'DiffModule is currently disabled via ModuleControlService. Diff operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('DiffModule')) {
      throw new ForbiddenException(
        'Diff module is currently disabled. Cannot perform Diff operations.',
      );
    }
  }
  
  
  private get userId(): string | undefined {
  return this.request.user?.id;
}
  

  create(data: CreateDiffDto) {
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
    

   
    return this.prisma.diff.create({ data: createData });
  }
  
  async findAllPaginated(
  query: PaginationDiffQueryDto,
  select?: Prisma.DiffSelect,
) {
  const page = query.page ? Number(query.page) : 1;
  const pageSize = query.pageSize ? Number(query.pageSize) : 10;
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const where = this.buildWhereFromQuery(query);

  const [items, total] = await this.prisma.$transaction([
    this.prisma.diff.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      ...(select ? { select } : {}),
    }),
    this.prisma.diff.count({ where }),
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
    return this.prisma.diff.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.diff.findUnique(
    
    { where: { id } }
    
    );
  }

  update(id: string, data: UpdateDiffDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.diff.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.diff.delete({ where: { id } });
  }


  
  
  private buildWhereFromQuery(query: PaginationDiffQueryDto): Prisma.DiffWhereInput {

  const where: Prisma.DiffWhereInput = {
    
    createdById:this.userId
    
  };
     
  if (query.filePath !== undefined) {
    
    where.filePath = query.filePath;
    
  }
  if (query.diff !== undefined) {
    
    where.diff = query.diff;
    
  }
  if (query.proposedFileChangeId !== undefined) {
    
    where.proposedFileChangeId = query.proposedFileChangeId;
    
  }


  return where;
}
}
