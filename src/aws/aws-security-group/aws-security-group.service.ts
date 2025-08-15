import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EC2Client,
  DescribeSecurityGroupsCommand,
  AuthorizeSecurityGroupIngressCommand,
  RevokeSecurityGroupIngressCommand,
  CreateSecurityGroupCommand,
  DeleteSecurityGroupCommand,
  CreateTagsCommand,
  DescribeSecurityGroupsCommandOutput,
  DescribeSecurityGroupsCommandInput,
  AuthorizeSecurityGroupEgressCommand,
  RevokeSecurityGroupEgressCommand,
  Tag,
} from '@aws-sdk/client-ec2';

import { ManagePortDto } from './dto/manage-port.dto';
import { CreateSecurityGroupDto } from './dto/create-security-group.dto';
import { UpdateSecurityGroupDto } from './dto/update-security-group.dto';
import { DescribeSecurityGroupDto } from './dto/describe-security-group.dto';
import { ManageIngressEgressDto } from './dto/manage-ingress-egress.dto';

@Injectable()
export class AwsSecurityGroupService {
  private readonly logger = new Logger(AwsSecurityGroupService.name);
  private readonly ec2Client: EC2Client;

  constructor(private readonly configService: ConfigService) {
    const region =
      this.configService.get<string>('AWS_REGION') || 'ap-southeast-2';
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn(
        'AWS credentials are not fully set. EC2 operations may fail.',
      );
    }

    this.ec2Client = new EC2Client({
      region,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
    });
  }

  async listSecurityGroups(nextToken?: string) {
    try {
      const command = new DescribeSecurityGroupsCommand({
        MaxResults: 50,
        NextToken: nextToken,
      });
      return await this.ec2Client.send(command);
    } catch (error) {
      this.logger.error('Error fetching security groups', error);
      throw new InternalServerErrorException(
        'Failed to list AWS Security Groups',
      );
    }
  }

  async describeSecurityGroupById(dto: DescribeSecurityGroupDto) {
    try {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [dto.groupId],
      });
      const response = await this.ec2Client.send(command);
      return response.SecurityGroups?.[0];
    } catch (error) {
      this.logger.error('Error describing security group by ID', error);
      throw new InternalServerErrorException(
        'Failed to describe security group',
      );
    }
  }

  async createSecurityGroup(dto: CreateSecurityGroupDto): Promise<string> {
    try {
      const { groupName, description, vpcId } = dto;

      const result = await this.ec2Client.send(
        new CreateSecurityGroupCommand({
          GroupName: groupName,
          Description: description,
          VpcId: vpcId,
        }),
      );

      const groupId = result.GroupId;
      this.logger.log(`Created Security Group: ${groupId}`);

      if (groupId) {
        await this.ec2Client.send(
          new CreateTagsCommand({
            Resources: [groupId],
            Tags: [{ Key: 'Name', Value: groupName }],
          }),
        );
      }

      return groupId!;
    } catch (error) {
      this.logger.error('Failed to create security group', error);
      throw new InternalServerErrorException('Error creating security group');
    }
  }

  async deleteSecurityGroup(groupId: string): Promise<void> {
    try {
      await this.ec2Client.send(
        new DeleteSecurityGroupCommand({ GroupId: groupId }),
      );
      this.logger.log(`Deleted Security Group: ${groupId}`);
    } catch (error) {
      this.logger.error('Failed to delete security group', error);
      throw new InternalServerErrorException('Error deleting security group');
    }
  }

  async updateSecurityGroup(dto: UpdateSecurityGroupDto): Promise<void> {
    const { groupId, groupName, description } = dto;

    if (!groupId) {
      throw new InternalServerErrorException('Security Group ID is required');
    }

    const tags: Tag[] = [];

    if (groupName) {
      tags.push({ Key: 'Name', Value: groupName });
    }

    if (description) {
      tags.push({ Key: 'Description', Value: description });
    }

    if (tags.length === 0) {
      throw new InternalServerErrorException(
        'At least one of groupName or description must be provided to update.',
      );
    }

    try {
      await this.ec2Client.send(
        new CreateTagsCommand({
          Resources: [groupId],
          Tags: tags,
        }),
      );

      this.logger.log(
        `Updated Security Group (${groupId}) with tags: ${JSON.stringify(tags)}`,
      );
    } catch (error) {
      this.logger.error(`Failed to update security group ${groupId}`, error);
      throw new InternalServerErrorException('Error updating security group');
    }
  }

  async addRule(dto: ManageIngressEgressDto): Promise<void> {
    const { groupId, fromPort, toPort, protocol, cidr, direction } = dto;
    const permission = {
      IpProtocol: protocol,
      FromPort: fromPort,
      ToPort: toPort ?? fromPort,
      IpRanges: [{ CidrIp: cidr }],
    };

    try {
      if (direction === 'ingress') {
        await this.ec2Client.send(
          new AuthorizeSecurityGroupIngressCommand({
            GroupId: groupId,
            IpPermissions: [permission],
          }),
        );
        this.logger.log(`Ingress rule added to ${groupId}`);
      } else {
        await this.ec2Client.send(
          new AuthorizeSecurityGroupEgressCommand({
            GroupId: groupId,
            IpPermissions: [permission],
          }),
        );
        this.logger.log(`Egress rule added to ${groupId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to add ${direction} rule`, error);
      throw new InternalServerErrorException(`Failed to add ${direction} rule`);
    }
  }

  async revokeRule(dto: ManageIngressEgressDto): Promise<void> {
    const { groupId, fromPort, toPort, protocol, cidr, direction } = dto;
    const permission = {
      IpProtocol: protocol,
      FromPort: fromPort,
      ToPort: toPort ?? fromPort,
      IpRanges: [{ CidrIp: cidr }],
    };

    try {
      if (direction === 'ingress') {
        await this.ec2Client.send(
          new RevokeSecurityGroupIngressCommand({
            GroupId: groupId,
            IpPermissions: [permission],
          }),
        );
        this.logger.log(`Ingress rule revoked from ${groupId}`);
      } else {
        await this.ec2Client.send(
          new RevokeSecurityGroupEgressCommand({
            GroupId: groupId,
            IpPermissions: [permission],
          }),
        );
        this.logger.log(`Egress rule revoked from ${groupId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to revoke ${direction} rule`, error);
      throw new InternalServerErrorException(
        `Failed to revoke ${direction} rule`,
      );
    }
  }
}
