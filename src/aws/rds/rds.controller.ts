import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RdsService } from './rds.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('AWS')
@Controller('api/aws/rds')
export class RdsController {
  constructor(private readonly rdsService: RdsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'List all PostgreSQL RDS instances' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of all PostgreSQL RDS instances',
  })
  async listInstances() {
    return this.rdsService.listInstances();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get details of a specific RDS instance' })
  @ApiParam({ name: 'id', description: 'RDS instance identifier' })
  @ApiResponse({
    status: 200,
    description: 'Returns details of the specified RDS instance',
  })
  @ApiResponse({ status: 404, description: 'RDS instance not found' })
  async getInstance(@Param('id') id: string) {
    return this.rdsService.getInstance(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new PostgreSQL RDS instance' })
  @ApiBody({
    description: 'RDS instance creation parameters',
    schema: {
      type: 'object',
      required: ['dbInstanceIdentifier'],
      properties: {
        dbInstanceIdentifier: { type: 'string', example: 'my-postgres-db' },
        dbInstanceClass: { type: 'string', example: 'db.t3.micro' },
        allocatedStorage: { type: 'number', example: 20 },
        masterUsername: { type: 'string', example: 'postgres' },
        masterUserPassword: { type: 'string', example: 'StrongPassword123!' },
        vpcSecurityGroupIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['sg-12345678'],
        },
        dbSubnetGroupName: { type: 'string', example: 'my-db-subnet-group' },
        availabilityZone: { type: 'string', example: 'us-east-1a' },
        multiAZ: { type: 'boolean', example: false },
        tags: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              Key: { type: 'string' },
              Value: { type: 'string' },
            },
          },
          example: [{ Key: 'Environment', Value: 'Production' }],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'RDS instance created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input parameters' })
  async createInstance(
    @Body()
    createParams: {
      dbInstanceIdentifier: string;
      dbInstanceClass?: string;
      allocatedStorage?: number;
      masterUsername?: string;
      masterUserPassword?: string;
      vpcSecurityGroupIds?: string[];
      dbSubnetGroupName?: string;
      availabilityZone?: string;
      multiAZ?: boolean;
      tags?: { Key: string; Value: string }[];
    },
  ) {
    return this.rdsService.createInstance(createParams);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete an RDS instance' })
  @ApiParam({ name: 'id', description: 'RDS instance identifier' })
  @ApiQuery({
    name: 'skipFinalSnapshot',
    required: false,
    type: Boolean,
    description: 'Whether to skip taking a final snapshot',
  })
  @ApiQuery({
    name: 'finalDBSnapshotIdentifier',
    required: false,
    type: String,
    description: 'Name for the final snapshot',
  })
  @ApiResponse({ status: 200, description: 'RDS instance deletion initiated' })
  @ApiResponse({ status: 404, description: 'RDS instance not found' })
  async deleteInstance(
    @Param('id') id: string,
    @Query('skipFinalSnapshot') skipFinalSnapshot?: boolean,
    @Query('finalDBSnapshotIdentifier') finalDBSnapshotIdentifier?: string,
  ) {
    return this.rdsService.deleteInstance({
      dbInstanceIdentifier: id,
      skipFinalSnapshot: skipFinalSnapshot === true,
      finalDBSnapshotIdentifier,
    });
  }

  @Post(':id/stop')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Stop an RDS instance' })
  @ApiParam({ name: 'id', description: 'RDS instance identifier' })
  @ApiResponse({
    status: 200,
    description: 'RDS instance stopped successfully',
  })
  @ApiResponse({ status: 404, description: 'RDS instance not found' })
  async stopInstance(@Param('id') id: string) {
    return this.rdsService.stopInstance(id);
  }

  @Post(':id/start')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Start an RDS instance' })
  @ApiParam({ name: 'id', description: 'RDS instance identifier' })
  @ApiResponse({
    status: 200,
    description: 'RDS instance started successfully',
  })
  @ApiResponse({ status: 404, description: 'RDS instance not found' })
  async startInstance(@Param('id') id: string) {
    return this.rdsService.startInstance(id);
  }

  @Post(':id/reboot')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Reboot an RDS instance' })
  @ApiParam({ name: 'id', description: 'RDS instance identifier' })
  @ApiQuery({
    name: 'forceFailover',
    required: false,
    type: Boolean,
    description: 'Whether to force a failover during reboot',
  })
  @ApiResponse({
    status: 200,
    description: 'RDS instance rebooted successfully',
  })
  @ApiResponse({ status: 404, description: 'RDS instance not found' })
  async rebootInstance(
    @Param('id') id: string,
    @Query('forceFailover') forceFailover?: boolean,
  ) {
    return this.rdsService.rebootInstance(id, forceFailover === true);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Modify an RDS instance' })
  @ApiParam({ name: 'id', description: 'RDS instance identifier' })
  @ApiBody({
    description: 'RDS instance modification parameters',
    schema: {
      type: 'object',
      properties: {
        dbInstanceClass: { type: 'string', example: 'db.t3.small' },
        allocatedStorage: { type: 'number', example: 30 },
        masterUserPassword: {
          type: 'string',
          example: 'NewStrongPassword123!',
        },
        backupRetentionPeriod: { type: 'number', example: 14 },
        preferredBackupWindow: { type: 'string', example: '03:00-04:00' },
        preferredMaintenanceWindow: {
          type: 'string',
          example: 'sun:05:00-sun:06:00',
        },
        multiAZ: { type: 'boolean', example: true },
        engineVersion: { type: 'string', example: '13.7' },
        allowMajorVersionUpgrade: { type: 'boolean', example: false },
        autoMinorVersionUpgrade: { type: 'boolean', example: true },
        applyImmediately: { type: 'boolean', example: false },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'RDS instance modified successfully',
  })
  @ApiResponse({ status: 404, description: 'RDS instance not found' })
  async modifyInstance(
    @Param('id') id: string,
    @Body()
    modifyParams: {
      dbInstanceClass?: string;
      allocatedStorage?: number;
      masterUserPassword?: string;
      backupRetentionPeriod?: number;
      preferredBackupWindow?: string;
      preferredMaintenanceWindow?: string;
      multiAZ?: boolean;
      engineVersion?: string;
      allowMajorVersionUpgrade?: boolean;
      autoMinorVersionUpgrade?: boolean;
      applyImmediately?: boolean;
    },
  ) {
    return this.rdsService.modifyInstance({
      dbInstanceIdentifier: id,
      ...modifyParams,
    });
  }
}
