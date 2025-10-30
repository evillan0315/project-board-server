import { Logger, Injectable, Inject, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleControlService } from '../module-control/module-control.service';

import {
  CreateExecutionSnapshotDto,
  PaginationExecutionSnapshotResultDto,
  PaginationExecutionSnapshotQueryDto,
} from './dto/create-execution-snapshot.dto';

import { UpdateExecutionSnapshotDto } from './dto/update-execution-snapshot.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';


import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';



@Injectable()
export class ExecutionSnapshotService {
  private readonly logger = new Logger(ExecutionSnapshotService.name);
  constructor(
    
    private readonly moduleControlService: ModuleControlService, 
    private prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if ExecutionSnapshotModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('ExecutionSnapshotModule')) {
      this.logger.warn(
        'ExecutionSnapshotModule is currently disabled via ModuleControlService. ExecutionSnapshot operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('ExecutionSnapshotModule')) {
      throw new ForbiddenException(
        'ExecutionSnapshot module is currently disabled. Cannot perform ExecutionSnapshot operations.',
      );
    }
  }
  
  
  private get userId(): string | undefined {
  return this.request.user?.id;
}
  

  create(data: CreateExecutionSnapshotDto) {
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
    

   
    return this.prisma.executionSnapshot.create({ data: createData });
  }
  
  async findAllPaginated(
  query: PaginationExecutionSnapshotQueryDto,
  select?: Prisma.ExecutionSnapshotSelect,
) {
  const page = query.page ? Number(query.page) : 1;
  const pageSize = query.pageSize ? Number(query.pageSize) : 10;
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const where = this.buildWhereFromQuery(query);

  const [items, total] = await this.prisma.$transaction([
    this.prisma.executionSnapshot.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      ...(select ? { select } : {}),
    }),
    this.prisma.executionSnapshot.count({ where }),
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
    return this.prisma.executionSnapshot.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.executionSnapshot.findUnique(
    
    { where: { id } }
    
    );
  }

  update(id: string, data: UpdateExecutionSnapshotDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.executionSnapshot.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.executionSnapshot.delete({ where: { id } });
  }


  
  
  private buildWhereFromQuery(query: PaginationExecutionSnapshotQueryDto): Prisma.ExecutionSnapshotWhereInput {

  const where: Prisma.ExecutionSnapshotWhereInput = {
    
    createdById:this.userId
    
  };
     
  if (query.planId !== undefined) {
    
    where.planId = query.planId;
    
  }
  if (query.success !== undefined) {
    
    where.success = query.success;
    
  }
  if (query.error !== undefined) {
    
    where.error = query.error;
    
  }
  if (query.commitHash !== undefined) {
    
    where.commitHash = query.commitHash;
    
  }
  if (query.appliedChanges !== undefined) {
    
    where.appliedChanges = query.appliedChanges;
    
  }


  return where;
}
}
