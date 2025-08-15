// dto/create-security-group.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateSecurityGroupDto {
  @ApiProperty({ example: 'my-new-sg' })
  @IsString()
  groupName: string;

  @ApiProperty({ example: 'Security group for my app' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'vpc-0123456789abcdef0' })
  @IsString()
  vpcId: string;
}
