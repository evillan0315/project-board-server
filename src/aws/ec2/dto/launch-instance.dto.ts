import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsObject,
} from 'class-validator';

/**
 * Enum for EC2 instance types
 */
export enum InstanceTypeEnum {
  T2_MICRO = 't2.micro',
  T2_SMALL = 't2.small',
  T2_MEDIUM = 't2.medium',
  T3_MICRO = 't3.micro',
  T3_SMALL = 't3.small',
  T3_MEDIUM = 't3.medium',
  T3_LARGE = 't3.large',
}

/**
 * Data Transfer Object for launching a new EC2 instance
 */
export class LaunchInstanceDto {
  @ApiProperty({
    description: 'The ID of the AMI to use for the instance',
    example: 'ami-0abcdef1234567890',
  })
  @IsString()
  imageId: string;

  @ApiProperty({
    description: 'The type of instance to launch',
    enum: InstanceTypeEnum,
    example: InstanceTypeEnum.T2_MICRO,
  })
  @IsEnum(InstanceTypeEnum)
  instanceType: string;

  @ApiPropertyOptional({
    description: 'The IDs of the security groups for the instance',
    example: ['sg-0123456789abcdef0'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  securityGroupIds?: string[];

  @ApiPropertyOptional({
    description: 'The ID of the subnet to launch the instance into',
    example: 'subnet-0123456789abcdef0',
  })
  @IsOptional()
  @IsString()
  subnetId?: string;

  @ApiPropertyOptional({
    description: 'The name of the key pair to use for the instance',
    example: 'my-key-pair',
  })
  @IsOptional()
  @IsString()
  keyName?: string;

  @ApiPropertyOptional({
    description: 'Tags to apply to the instance',
    example: { Name: 'My Instance', Environment: 'Development' },
  })
  @IsOptional()
  @IsObject()
  tags?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'User data to make available to the instance',
    example: '#!/bin/bash\necho "Hello, World!" > /tmp/hello.txt',
  })
  @IsOptional()
  @IsString()
  userData?: string;
}
