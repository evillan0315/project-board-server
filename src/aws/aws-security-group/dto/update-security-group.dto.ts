// dto/update-security-group.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateSecurityGroupDto {
  @ApiProperty({ example: 'sg-0123456789abcdef0' })
  @IsString()
  groupId: string;

  @ApiProperty({ example: 'updated-sg-name' })
  @IsString()
  groupName: string;

  @ApiProperty({ example: 'Updated description' })
  @IsString()
  description: string;
}
