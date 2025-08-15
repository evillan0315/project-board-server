import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsIn, Matches } from 'class-validator';

export class ManagePortDto {
  @ApiProperty({
    example: 'sg-0123456789abcdef0',
    description: 'Security Group ID',
  })
  @IsString()
  groupId: string;

  @ApiProperty({ example: 5000, description: 'Start port' })
  @IsInt()
  fromPort: number;

  @ApiPropertyOptional({ example: 5005, description: 'End port (optional)' })
  @IsOptional()
  @IsInt()
  toPort?: number;

  @ApiProperty({
    example: 'udp',
    description: 'Protocol to manage (tcp or udp)',
    enum: ['tcp', 'udp'],
  })
  @IsString()
  @IsIn(['tcp', 'udp'])
  protocol: string;

  @ApiProperty({ example: '0.0.0.0/0', description: 'CIDR IP range' })
  @Matches(/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/, {
    message: 'CIDR must be in valid IPv4 CIDR notation',
  })
  cidr: string;
}
