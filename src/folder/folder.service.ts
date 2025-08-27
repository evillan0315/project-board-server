import { Logger, Injectable, Inject, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleControlService } from '../module-control/module-control.service';

import {
  CreateFolderDto,
  PaginationFolderResultDto,
  PaginationFolderQueryDto,
} from './dto/create-folder.dto';

import { UpdateFolderDto } from './dto/update-folder.dto';

import { Prisma } from '@prisma/client';

import { CreateJwtUserDto } from '../auth/dto/auth.dto';


import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';



@Injectable()
export class FolderService {
  private readonly logger = new Logger(FolderService.name);
  constructor(
    
    private readonly moduleControlService: ModuleControlService, 
    private prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request & { user?: CreateJwtUserDto },
  ) {}
  // Use OnModuleInit to check the module status after all dependencies are initialized
  onModuleInit() {
    // Optionally, you could log a warning or take action if FolderModule is disabled on startup
    if (!this.moduleControlService.isModuleEnabled('FolderModule')) {
      this.logger.warn(
        'FolderModule is currently disabled via ModuleControlService. Folder operations will be restricted.',
      );
    }
  }
  private ensureFileModuleEnabled(): void {
    if (!this.moduleControlService.isModuleEnabled('FolderModule')) {
      throw new ForbiddenException(
        'Folder module is currently disabled. Cannot perform Folder operations.',
      );
    }
  }
  
  
  private get userId(): string | undefined {
  return this.request.user?.id;
}
  

  create(data: CreateFolderDto) {
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
    

   
    return this.prisma.folder.create({ data: createData });
  }
  
  async findAllPaginated(
  query: PaginationFolderQueryDto,
  select?: Prisma.FolderSelect,
) {
  const page = query.page ? Number(query.page) : 1;
  const pageSize = query.pageSize ? Number(query.pageSize) : 10;
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const where = this.buildWhereFromQuery(query);

  const [items, total] = await this.prisma.$transaction([
    this.prisma.folder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      ...(select ? { select } : {}),
    }),
    this.prisma.folder.count({ where }),
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
    return this.prisma.folder.findMany();
  }

  findOne(id: string) {
    this.ensureFileModuleEnabled();

    return this.prisma.folder.findUnique(
    
    { where: { id } }
    
    );
  }

  update(id: string, data: UpdateFolderDto) {
    this.ensureFileModuleEnabled();
    return this.prisma.folder.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.folder.delete({ where: { id } });
  }


  
  
  private buildWhereFromQuery(query: PaginationFolderQueryDto): Prisma.FolderWhereInput {

  const where: Prisma.FolderWhereInput = {
    
    createdById:this.userId
    
  };
     
  if (query.name !== undefined) {
    
    where.name = query.name;
    
  }
  if (query.path !== undefined) {
    
    where.path = query.path;
    
  }
  if (query.parentId !== undefined) {
    
    where.parentId = query.parentId;
    
  }


  return where;
}
}
