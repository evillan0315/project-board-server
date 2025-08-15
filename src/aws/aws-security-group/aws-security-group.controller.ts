import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

import { AwsSecurityGroupService } from './aws-security-group.service';
import { SecurityGroupDto } from './dto/security-group.dto';
import { CreateSecurityGroupDto } from './dto/create-security-group.dto';
import { UpdateSecurityGroupDto } from './dto/update-security-group.dto';
import { DescribeSecurityGroupDto } from './dto/describe-security-group.dto';
import { ManageIngressEgressDto } from './dto/manage-ingress-egress.dto';

import { JwtAuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('AWS')
@Controller('api/aws/security-group')
export class AwsSecurityGroupController {
  constructor(
    private readonly awsSecurityGroupService: AwsSecurityGroupService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'List EC2 Security Groups (with tags, rules, pagination)',
  })
  @ApiQuery({ name: 'nextToken', required: false })
  @ApiResponse({
    status: 200,
    description: 'List of security groups',
    type: [SecurityGroupDto],
  })
  async listAll(
    @Query('nextToken') nextToken?: string,
  ): Promise<{ groups: SecurityGroupDto[]; nextToken?: string }> {
    const result =
      await this.awsSecurityGroupService.listSecurityGroups(nextToken);

    const groups =
      result.SecurityGroups?.map((sg) => ({
        groupId: sg.GroupId ?? '',
        groupName: sg.GroupName ?? '',
        description: sg.Description ?? '',
        vpcId: sg.VpcId ?? undefined,
        inboundRules: sg.IpPermissions?.map((perm) => ({
          ipProtocol: perm.IpProtocol ?? '',
          fromPort: perm.FromPort,
          toPort: perm.ToPort,
          ipRanges: (perm.IpRanges || []).map((range) => ({
            cidrIp: range.CidrIp ?? '',
          })),
        })),
        tags: (sg.Tags || []).map((tag) => ({
          key: tag.Key ?? '',
          value: tag.Value ?? '',
        })),
      })) || [];

    return {
      groups,
      nextToken: result.NextToken,
    };
  }

  @Get(':groupId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Describe a specific security group by ID' })
  @ApiParam({ name: 'groupId', required: true })
  @ApiResponse({ status: 200, description: 'Security group details' })
  async describeById(@Param('groupId') groupId: string) {
    return this.awsSecurityGroupService.describeSecurityGroupById({ groupId });
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new Security Group' })
  @ApiResponse({ status: 201, description: 'Security group created' })
  async create(@Body() dto: CreateSecurityGroupDto): Promise<string> {
    return this.awsSecurityGroupService.createSecurityGroup(dto);
  }

  @Put()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update tags of a Security Group' })
  @ApiResponse({ status: 200, description: 'Security group updated' })
  async update(@Body() dto: UpdateSecurityGroupDto): Promise<void> {
    return this.awsSecurityGroupService.updateSecurityGroup(dto);
  }

  @Delete(':groupId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a Security Group' })
  @ApiParam({ name: 'groupId', required: true })
  @ApiResponse({ status: 200, description: 'Security group deleted' })
  async delete(@Param('groupId') groupId: string): Promise<void> {
    return this.awsSecurityGroupService.deleteSecurityGroup(groupId);
  }

  @Post('add-rule')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add ingress or egress rule to a security group' })
  @ApiResponse({ status: 201, description: 'Rule added successfully' })
  async addRule(@Body() dto: ManageIngressEgressDto): Promise<void> {
    return await this.awsSecurityGroupService.addRule(dto);
  }

  @Post('revoke-rule')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Revoke ingress or egress rule from a security group',
  })
  @ApiResponse({ status: 200, description: 'Rule revoked successfully' })
  async revokeRule(@Body() dto: ManageIngressEgressDto): Promise<void> {
    return await this.awsSecurityGroupService.revokeRule(dto);
  }
}
