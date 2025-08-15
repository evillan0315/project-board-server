import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsIn } from 'class-validator';

export class ManageIngressEgressDto {
  @ApiProperty({ example: 'sg-0123456789abcdef0' })
  @IsString()
  groupId: string;

  @ApiProperty({ example: 'tcp' })
  @IsString()
  protocol: string;

  @ApiProperty({ example: 80 })
  @IsInt()
  fromPort: number;

  @ApiProperty({ example: 80, required: false })
  @IsOptional()
  @IsInt()
  toPort?: number;

  @ApiProperty({ example: '0.0.0.0/0' })
  @IsString()
  cidr: string;

  @ApiProperty({ example: 'ingress', enum: ['ingress', 'egress'] })
  @IsIn(['ingress', 'egress'])
  direction: 'ingress' | 'egress';
}
