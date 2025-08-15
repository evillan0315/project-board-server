import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  EC2Client,
  DescribeInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  TerminateInstancesCommand,
  RunInstancesCommand,
  DescribeInstanceStatusCommand,
  Instance,
  _InstanceType,
  Tag,
  CreateTagsCommand,
  TagSpecification,
  ResourceType,
  DescribeSecurityGroupsCommand,
  DescribeSecurityGroupsCommandOutput,
} from '@aws-sdk/client-ec2';
import { ConfigService } from '@nestjs/config';
import { LaunchInstanceDto } from './dto/launch-instance.dto';
import { EC2InstanceResponse } from './interfaces/ec2-instance-reponse.interface';

/**
 * Service for managing EC2 instances
 * Provides methods for listing, starting, stopping, terminating, and launching EC2 instances
 */
@Injectable()
export class Ec2Service {
  private readonly ec2: EC2Client;
  private readonly logger = new Logger(Ec2Service.name);

  constructor(private configService: ConfigService) {
    // Initialize EC2 client with credentials from environment variables
    const region =
      this.configService.get<string>('AWS_REGION') || 'ap-southeast-2';
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    if (!region || !accessKeyId || !secretAccessKey) {
      this.logger.warn(
        'AWS credentials not fully configured. EC2 operations may fail.',
      );
    }

    this.ec2 = new EC2Client({
      region,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
    });
  }

  /**
   * List all EC2 instances in the account
   * @returns Array of EC2 instance details
   */
  async listInstances(): Promise<EC2InstanceResponse[]> {
    try {
      const command = new DescribeInstancesCommand({});
      const response = await this.ec2.send(command);

      // Transform the response to a more user-friendly format
      const instances =
        response.Reservations?.flatMap((r) => r.Instances || []) || [];

      return instances.map((instance) => this.formatInstanceResponse(instance));
    } catch (error) {
      this.logger.error(
        `Failed to list instances: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to list EC2 instances: ${error.message}`,
      );
    }
  }

  /**
   * Get details of a specific EC2 instance
   * @param instanceId The ID of the instance to retrieve
   * @returns Instance details
   */
  async getInstance(instanceId: string): Promise<EC2InstanceResponse> {
    try {
      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });

      const response = await this.ec2.send(command);
      const instance = response.Reservations?.[0]?.Instances?.[0];

      if (!instance) {
        throw new NotFoundException(`Instance with ID ${instanceId} not found`);
      }

      return this.formatInstanceResponse(instance);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get instance ${instanceId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to get EC2 instance: ${error.message}`,
      );
    }
  }

  /**
   * Start an EC2 instance
   * @param instanceId The ID of the instance to start
   * @returns Operation result
   */
  async startInstance(instanceId: string): Promise<any> {
    try {
      // Verify instance exists before attempting to start
      await this.getInstance(instanceId);

      const command = new StartInstancesCommand({ InstanceIds: [instanceId] });
      const result = await this.ec2.send(command);

      this.logger.log(`Started instance ${instanceId}`);
      return {
        success: true,
        message: `Instance ${instanceId} starting`,
        stateChange: result.StartingInstances?.[0]?.CurrentState,
      };
    } catch (error) {
      this.logger.error(
        `Failed to start instance ${instanceId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to start instance: ${error.message}`,
      );
    }
  }

  /**
   * Stop an EC2 instance
   * @param instanceId The ID of the instance to stop
   * @returns Operation result
   */
  async stopInstance(instanceId: string): Promise<any> {
    try {
      // Verify instance exists before attempting to stop
      await this.getInstance(instanceId);

      const command = new StopInstancesCommand({ InstanceIds: [instanceId] });
      const result = await this.ec2.send(command);

      this.logger.log(`Stopped instance ${instanceId}`);
      return {
        success: true,
        message: `Instance ${instanceId} stopping`,
        stateChange: result.StoppingInstances?.[0]?.CurrentState,
      };
    } catch (error) {
      this.logger.error(
        `Failed to stop instance ${instanceId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to stop instance: ${error.message}`,
      );
    }
  }

  /**
   * Terminate an EC2 instance
   * @param instanceId The ID of the instance to terminate
   * @returns Operation result
   */
  async terminateInstance(instanceId: string): Promise<any> {
    try {
      // Verify instance exists before attempting to terminate
      await this.getInstance(instanceId);

      const command = new TerminateInstancesCommand({
        InstanceIds: [instanceId],
      });
      const result = await this.ec2.send(command);

      this.logger.log(`Terminated instance ${instanceId}`);
      return {
        success: true,
        message: `Instance ${instanceId} terminating`,
        stateChange: result.TerminatingInstances?.[0]?.CurrentState,
      };
    } catch (error) {
      this.logger.error(
        `Failed to terminate instance ${instanceId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to terminate instance: ${error.message}`,
      );
    }
  }

  /**
   * Launch a new EC2 instance
   * @param dto Launch instance parameters
   * @returns Details of the launched instance
   */
  async launchInstance(dto: LaunchInstanceDto): Promise<any> {
    try {
      // Prepare tags if provided
      const tagSpecifications: TagSpecification[] | undefined = dto.tags
        ? [
            {
              ResourceType: 'instance' as ResourceType,
              Tags: Object.entries(dto.tags).map(([key, value]) => ({
                Key: key,
                Value: value,
              })),
            },
          ]
        : undefined;

      // Create the command with all provided parameters
      const command = new RunInstancesCommand({
        ImageId: dto.imageId,
        InstanceType: dto.instanceType as _InstanceType,
        MinCount: 1,
        MaxCount: 1,
        SecurityGroupIds: dto.securityGroupIds,
        SubnetId: dto.subnetId,
        KeyName: dto.keyName,
        TagSpecifications: tagSpecifications,
        UserData: dto.userData
          ? Buffer.from(dto.userData).toString('base64')
          : undefined,
      });

      const result = await this.ec2.send(command);
      const instanceId = result.Instances?.[0]?.InstanceId;

      this.logger.log(`Launched new instance ${instanceId}`);
      return {
        success: true,
        message: 'Instance launched successfully',
        instance: result.Instances?.[0]
          ? this.formatInstanceResponse(result.Instances[0])
          : null,
      };
    } catch (error) {
      this.logger.error(
        `Failed to launch instance: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to launch instance: ${error.message}`,
      );
    }
  }

  /**
   * Get the status of an EC2 instance
   * @param instanceId The ID of the instance to check
   * @returns Instance status details
   */
  async getInstanceStatus(instanceId: string): Promise<any> {
    try {
      const command = new DescribeInstanceStatusCommand({
        InstanceIds: [instanceId],
        IncludeAllInstances: true,
      });

      const result = await this.ec2.send(command);

      if (!result.InstanceStatuses?.[0]) {
        throw new NotFoundException(
          `Instance status for ${instanceId} not found`,
        );
      }

      return {
        instanceId,
        status: result.InstanceStatuses[0].InstanceStatus,
        systemStatus: result.InstanceStatuses[0].SystemStatus,
        state: result.InstanceStatuses[0].InstanceState,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get instance status for ${instanceId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to get instance status: ${error.message}`,
      );
    }
  }

  /**
   * Add tags to an EC2 instance
   * @param instanceId The ID of the instance to tag
   * @param tags Object containing key-value pairs for tags
   * @returns Operation result
   */
  async addTags(
    instanceId: string,
    tags: Record<string, string>,
  ): Promise<any> {
    try {
      // Verify instance exists before attempting to add tags
      await this.getInstance(instanceId);

      const tagList: Tag[] = Object.entries(tags).map(([key, value]) => ({
        Key: key,
        Value: value,
      }));

      const command = new CreateTagsCommand({
        Resources: [instanceId],
        Tags: tagList,
      });

      await this.ec2.send(command);

      this.logger.log(`Added tags to instance ${instanceId}`);
      return {
        success: true,
        message: `Tags added to instance ${instanceId}`,
        tags,
      };
    } catch (error) {
      this.logger.error(
        `Failed to add tags to instance ${instanceId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(`Failed to add tags: ${error.message}`);
    }
  }

  /**
   * Format instance data into a standardized response
   * @param instance Raw EC2 instance data
   * @returns Formatted instance data
   */
  private formatInstanceResponse(instance: Instance): EC2InstanceResponse {
    // Extract tags into a more usable format
    const tags: Record<string, string> = {};
    instance.Tags?.forEach((tag) => {
      if (tag.Key && tag.Value) {
        tags[tag.Key] = tag.Value;
      }
    });

    return {
      instanceId: instance.InstanceId,
      state: instance.State?.Name,
      instanceType: instance.InstanceType,
      publicIpAddress: instance.PublicIpAddress,
      privateIpAddress: instance.PrivateIpAddress,
      launchTime: instance.LaunchTime,
      tags,
      securityGroups: instance.SecurityGroups?.map((sg) => ({
        id: sg.GroupId,
        name: sg.GroupName,
      })),
      subnetId: instance.SubnetId,
      vpcId: instance.VpcId,
      architecture: instance.Architecture,
      platform: instance.Platform,
      rootDeviceType: instance.RootDeviceType,
      rootDeviceName: instance.RootDeviceName,
    };
  }
}
