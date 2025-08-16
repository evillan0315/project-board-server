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

export class CreateCommandHistoryDto {
  @ApiProperty({ description: 'command field' })
    @IsString()
    command: string;
  @ApiProperty({ description: 'executedAt field' })
    @IsDate()
    executedAt: Date;
  @ApiProperty({ description: 'status field' })
    @IsOptional()
    @IsString()
    status: string;
  @ApiProperty({ description: 'exitCode field' })
    @IsOptional()
    @IsInt()
    exitCode: number;
  @ApiProperty({ description: 'output field' })
    @IsOptional()
    @IsString()
    output: string;
  @ApiProperty({ description: 'errorOutput field' })
    @IsOptional()
    @IsString()
    errorOutput: string;
  @ApiProperty({ description: 'workingDirectory field' })
    @IsOptional()
    @IsString()
    workingDirectory: string;
  @ApiProperty({ description: 'durationMs field' })
    @IsOptional()
    @IsInt()
    durationMs: number;
  @ApiProperty({ description: 'shellType field' })
    @IsOptional()
    @IsString()
    shellType: string;
  @ApiProperty({ description: 'terminalSessionId field' })
    @IsString()
    terminalSessionId: string;



}

export class PaginationCommandHistoryResultDto {
  @ApiProperty({ type: [CreateCommandHistoryDto] })
  items: CreateCommandHistoryDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationCommandHistoryQueryDto {
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
  
  @ApiPropertyOptional({ description: 'Filter by command' })
  command?: string;
  @IsOptional()
  
  @Type(() => Date)
  @IsDate()
  
  @ApiPropertyOptional({ description: 'Filter by executedAt' })
  executedAt?: Date;
  @IsOptional()
  
  @IsString()
  
  @ApiPropertyOptional({ description: 'Filter by status' })
  status?: string;
  @IsOptional()
  
  @Type(() => Number)
  @IsNumber()
  
  @ApiPropertyOptional({ description: 'Filter by exitCode' })
  exitCode?: number;
  @IsOptional()
  
  @IsString()
  
  @ApiPropertyOptional({ description: 'Filter by output' })
  output?: string;
  @IsOptional()
  
  @IsString()
  
  @ApiPropertyOptional({ description: 'Filter by errorOutput' })
  errorOutput?: string;
  @IsOptional()
  
  @IsString()
  
  @ApiPropertyOptional({ description: 'Filter by workingDirectory' })
  workingDirectory?: string;
  @IsOptional()
  
  @Type(() => Number)
  @IsNumber()
  
  @ApiPropertyOptional({ description: 'Filter by durationMs' })
  durationMs?: number;
  @IsOptional()
  
  @IsString()
  
  @ApiPropertyOptional({ description: 'Filter by shellType' })
  shellType?: string;
  @IsOptional()
  
  @IsString()
  
  @ApiPropertyOptional({ description: 'Filter by terminalSessionId' })
  terminalSessionId?: string;



}

