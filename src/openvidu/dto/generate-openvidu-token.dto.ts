import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum OpenViduRole {
  SUBSCRIBER = 'SUBSCRIBER',
  PUBLISHER = 'PUBLISHER',
  MODERATOR = 'MODERATOR',
}

class KurentoOptionsDto {
  @ApiPropertyOptional({
    description: 'Minimum video send bandwidth in kbps.',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  videoMinSendBandwidth?: number;

  @ApiPropertyOptional({
    description: 'Maximum video send bandwidth in kbps.',
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  videoMaxSendBandwidth?: number;

  @ApiPropertyOptional({
    description: 'Minimum video receive bandwidth in kbps.',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  videoMinRecvBandwidth?: number;

  @ApiPropertyOptional({
    description: 'Maximum video receive bandwidth in kbps.',
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  videoMaxRecvBandwidth?: number;
}

export class GenerateOpenViduTokenDto {
  @ApiProperty({
    description:
      'ID of the OpenVidu session to connect to. If session does not exist, it will be created.',
    example: 'session-id-123',
  })
  @IsString()
  sessionId: string;

  @ApiPropertyOptional({
    description:
      'Role of the connection (SUBSCRIBER, PUBLISHER, MODERATOR). Defaults to PUBLISHER.',
    enum: OpenViduRole,
    example: OpenViduRole.PUBLISHER,
  })
  @IsOptional()
  @IsEnum(OpenViduRole)
  role?: OpenViduRole;

  @ApiPropertyOptional({
    description:
      'Arbitrary data associated with the connection, usually JSON string.',
    example: '{"username": "John Doe", "userId": "abc"}',
  })
  @IsOptional()
  @IsString()
  data?: string;

  @ApiPropertyOptional({
    type: KurentoOptionsDto,
    description: 'Kurento Media Server specific options for the connection.',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => KurentoOptionsDto)
  kurentoOptions?: KurentoOptionsDto;
}
