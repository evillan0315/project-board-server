import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DescribeSecurityGroupDto {
  @ApiProperty({ example: 'sg-0123456789abcdef0' })
  @IsString()
  groupId: string;
}
