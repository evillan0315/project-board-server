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

export class CreateMemberDto {
  @ApiProperty({ description: 'username field' })
  @IsString()
  username: string;
  @ApiProperty({ description: 'email field' })
  @IsEmail()
  email: string;
  @ApiProperty({ description: 'provider field' })
  @IsOptional()
  @IsString()
  provider: string;
  @ApiProperty({ description: 'confirmed field' })
  @IsBoolean()
  confirmed: boolean;
  @ApiProperty({ description: 'blocked field' })
  @IsBoolean()
  blocked: boolean;
  @ApiProperty({ description: 'role field' })
  @IsInt()
  role: number;
  @ApiProperty({ description: 'memberSystemId field' })
  @IsInt()
  memberSystemId: number;
  @ApiProperty({ description: 'jsonData field' })
  @IsObject()
  jsonData: any;
  @ApiProperty({ description: 'blockedExpire field' })
  @IsOptional()
  @IsDate()
  blockedExpire: Date;
  @ApiProperty({ description: 'blockedStart field' })
  @IsOptional()
  @IsDate()
  blockedStart: Date;
  @ApiProperty({ description: 'isPaid field' })
  @IsBoolean()
  isPaid: boolean;
  @ApiProperty({ description: 'createGroup field' })
  @IsBoolean()
  createGroup: boolean;
  @ApiProperty({ description: 'isEmployee field' })
  @IsBoolean()
  isEmployee: boolean;
  @ApiProperty({ description: 'isOnline field' })
  @IsBoolean()
  isOnline: boolean;
  @ApiProperty({ description: 'memberType field' })
  @IsString()
  memberType: string;
  @ApiProperty({ description: 'picture field' })
  @IsOptional()
  @IsString()
  picture: string;
  @ApiProperty({ description: 'adminUser field' })
  @IsOptional()
  @IsObject()
  adminUser: any;
  @ApiProperty({ description: 'latString field' })
  @IsOptional()
  @IsString()
  latString: string;
  @ApiProperty({ description: 'lonString field' })
  @IsOptional()
  @IsString()
  lonString: string;
  @ApiProperty({ description: 'userSetting field' })
  @IsOptional()
  @IsObject()
  userSetting: any;
  @ApiProperty({ description: 'terms field' })
  @IsOptional()
  @IsObject()
  terms: any;
}

export class PaginationMemberResultDto {
  @ApiProperty({ type: [CreateMemberDto] })
  items: CreateMemberDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationMemberQueryDto {
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
  @ApiPropertyOptional({ description: 'Filter by username' })
  username?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by email' })
  email?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by provider' })
  provider?: string;
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Filter by confirmed' })
  confirmed?: boolean;
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Filter by blocked' })
  blocked?: boolean;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({ description: 'Filter by role' })
  role?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({ description: 'Filter by memberSystemId' })
  memberSystemId?: number;
  @IsOptional()
  @ApiPropertyOptional({ description: 'Filter by jsonData' })
  jsonData?: any;
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @ApiPropertyOptional({ description: 'Filter by blockedExpire' })
  blockedExpire?: Date;
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @ApiPropertyOptional({ description: 'Filter by blockedStart' })
  blockedStart?: Date;
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Filter by isPaid' })
  isPaid?: boolean;
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Filter by createGroup' })
  createGroup?: boolean;
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Filter by isEmployee' })
  isEmployee?: boolean;
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Filter by isOnline' })
  isOnline?: boolean;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by memberType' })
  memberType?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by picture' })
  picture?: string;
  @IsOptional()
  @ApiPropertyOptional({ description: 'Filter by adminUser' })
  adminUser?: any;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by latString' })
  latString?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by lonString' })
  lonString?: string;
  @IsOptional()
  @ApiPropertyOptional({ description: 'Filter by userSetting' })
  userSetting?: any;
  @IsOptional()
  @ApiPropertyOptional({ description: 'Filter by terms' })
  terms?: any;
}
