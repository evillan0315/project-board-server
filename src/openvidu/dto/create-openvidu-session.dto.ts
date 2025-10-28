import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateOpenViduSessionDto {
  @ApiPropertyOptional({
    description:
      'Custom ID for the OpenVidu session. If not provided, OpenVidu generates one.',
    example: 'my-custom-session-id',
  })
  @IsOptional()
  @IsString()
  customSessionId?: string;
}
