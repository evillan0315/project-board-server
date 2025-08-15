import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SshCommandDto {
  @ApiProperty()
  @IsString()
  host: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  port?: number;

  @ApiProperty()
  @IsString()
  username: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  privateKeyPath?: string;

  @ApiProperty()
  @IsString()
  command: string;
}
