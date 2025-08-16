import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  IsBoolean,
  IsNumber,
  IsInt,
  IsDate,
  IsUUID,
  IsObject,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTerminalSessionDto {
  @ApiProperty({ description: 'name field' })
    @IsOptional()
    @IsString()
    name: string;
  @ApiProperty({ description: 'startedAt field' })
    @IsDate()
    startedAt: Date;
  @ApiProperty({ description: 'endedAt field' })
    @IsOptional()
    @IsDate()
    endedAt: Date;
  @ApiProperty({ description: 'ipAddress field' })
    @IsOptional()
    @IsString()
    ipAddress: string;
  @ApiProperty({ description: 'userAgent field' })
    @IsOptional()
    @IsString()
    userAgent: string;
  @ApiProperty({ description: 'clientInfo field' })
    @IsOptional()
    @IsObject()
    clientInfo: any;



}

export class PaginationTerminalSessionResultDto {
  @ApiProperty({ type: [CreateTerminalSessionDto] })
  items: CreateTerminalSessionDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationTerminalSessionQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @ApiPropertyOptional({ default: 1 })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @ApiPropertyOptional({ default: 10 })
  pageSize?: number = 10;

  @IsOptional()
  
  @IsString()
  
  @ApiPropertyOptional({ description: 'Filter by name' })
  name?: string;
  @IsOptional()
  
  @Type(() => Date)
  @IsDate()
  
  @ApiPropertyOptional({ description: 'Filter by startedAt' })
  startedAt?: Date;
  @IsOptional()
  
  @Type(() => Date)
  @IsDate()
  
  @ApiPropertyOptional({ description: 'Filter by endedAt' })
  endedAt?: Date;
  @IsOptional()
  
  @IsString()
  
  @ApiPropertyOptional({ description: 'Filter by ipAddress' })
  ipAddress?: string;
  @IsOptional()
  
  @IsString()
  
  @ApiPropertyOptional({ description: 'Filter by userAgent' })
  userAgent?: string;
  @IsOptional()
  
  @ApiPropertyOptional({ description: 'Filter by clientInfo' })
  clientInfo?: any;



}

