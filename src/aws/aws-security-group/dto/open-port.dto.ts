import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Matches, IsIn } from 'class-validator';

export class OpenPortDto {
  @ApiProperty({
    example: 'sg-0123456789abcdef0',
    description: 'Security Group ID',
  })
  @IsString()
  groupId: string;

  @ApiProperty({ example: 5000, description: 'Port to open' })
  @IsInt()
  port: number;

  @ApiProperty({
    example: 'udp',
    description: 'Protocol to open (tcp or udp)',
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
