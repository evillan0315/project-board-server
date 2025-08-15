import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  IsBoolean,
  IsNumber,
  IsInt,
  IsDate,
  IsObject,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ description: 'email field' })
  @IsEmail()
  email: string;
  @ApiProperty({ description: 'emailVerified field' })
  @IsOptional()
  @IsDate()
  emailVerified: Date;
  @ApiProperty({ description: 'image field' })
  @IsOptional()
  @IsString()
  image: string;
  @ApiProperty({ description: 'name field' })
  @IsOptional()
  @IsString()
  name: string;
  @ApiProperty({ description: 'phone_number field' })
  @IsOptional()
  @IsString()
  phone_number: string;
  @ApiProperty({ description: 'username field' })
  @IsOptional()
  @IsString()
  username: string;
}

export class PaginationUserResultDto {
  @ApiProperty({ type: [CreateUserDto] })
  items: CreateUserDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginationUserQueryDto {
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
}
