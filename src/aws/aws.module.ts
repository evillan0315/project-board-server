import { Module } from '@nestjs/common';
import { RdsController } from './rds/rds.controller';
import { Ec2Controller } from './ec2/ec2.controller';
import { S3Controller } from './s3/s3.controller';
import { AwsController } from './aws.controller';
import { AwsService } from './aws.service';
import { RdsService } from './rds/rds.service';
import { RdsBackupService } from './rds-backup/rds-backup.service';
import { RdsParameterService } from './rds-parameter/rds-parameter.service';
import { AwsBillingController } from './aws-billing/aws-billing.controller';
import { AwsBillingService } from './aws-billing/aws-billing.service';
import { Ec2Service } from './ec2/ec2.service';
import { DynamodbService } from './dynamodb/dynamodb.service';
import { DynamodbController } from './dynamodb/dynamodb.controller';
import { AwsSecurityGroupService } from './aws-security-group/aws-security-group.service';
import { AwsSecurityGroupController } from './aws-security-group/aws-security-group.controller';

@Module({
  controllers: [
    RdsController,
    Ec2Controller,
    S3Controller,
    AwsController,
    AwsBillingController,
    DynamodbController,
    AwsSecurityGroupController,
  ],
  providers: [
    AwsService,
    RdsService,
    RdsBackupService,
    RdsParameterService,
    AwsBillingService,
    Ec2Service,
    DynamodbService,
    AwsSecurityGroupService,
  ],
})
export class AwsModule {}
