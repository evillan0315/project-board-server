// dto/security-group.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IpPermissionDto {
  @ApiProperty({ example: 'tcp' })
  ipProtocol: string;

  @ApiPropertyOptional({ example: 22 })
  fromPort?: number;

  @ApiPropertyOptional({ example: 22 })
  toPort?: number;

  @ApiProperty({ example: [{ cidrIp: '0.0.0.0/0' }] })
  ipRanges: { cidrIp: string }[];
}

export class TagDto {
  @ApiProperty({ example: 'Name' })
  key: string;

  @ApiProperty({ example: 'WebSecurityGroup' })
  value: string;
}

export class SecurityGroupDto {
  @ApiProperty({ example: 'sg-0123456789abcdef0' })
  groupId: string;

  @ApiProperty({ example: 'web-sg' })
  groupName: string;

  @ApiProperty({ example: 'Allow web traffic' })
  description: string;

  @ApiPropertyOptional({ example: 'vpc-0123abcd4567efgh8' })
  vpcId?: string;

  @ApiPropertyOptional({ type: [IpPermissionDto] })
  inboundRules?: IpPermissionDto[];

  @ApiPropertyOptional({ type: [TagDto] })
  tags?: TagDto[];
}
