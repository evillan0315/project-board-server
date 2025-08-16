import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateTerminalSessionDto {
  @ApiProperty({ description: 'Optional name for the terminal session' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'IP address of the client', required: false })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({ description: 'User agent of the client', required: false })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({
    description: 'Additional client-side information',
    required: false,
  })
  @IsOptional()
  @IsObject()
  clientInfo?: object;
}
