import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

import { Ec2Service } from './ec2.service';
import { LaunchInstanceDto } from './dto/launch-instance.dto';

import { JwtAuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('AWS')
@Controller('api/aws/ec2')
export class Ec2Controller {
  constructor(private readonly ec2Service: Ec2Service) {}

  /**
   * List all EC2 instances
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all EC2 instances' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of EC2 instances',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - requires admin role',
  })
  async listInstances() {
    return this.ec2Service.listInstances();
  }

  /**
   * Get a specific EC2 instance by ID
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get EC2 instance details' })
  @ApiParam({
    name: 'id',
    description: 'EC2 instance ID',
    example: 'i-0123456789abcdef0',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'EC2 instance details',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Instance not found',
  })
  async getInstance(@Param('id') id: string) {
    return this.ec2Service.getInstance(id);
  }

  /**
   * Get status of a specific EC2 instance
   */
  @Get(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get EC2 instance status' })
  @ApiParam({
    name: 'id',
    description: 'EC2 instance ID',
    example: 'i-0123456789abcdef0',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'EC2 instance status',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Instance not found',
  })
  async getInstanceStatus(@Param('id') id: string) {
    return this.ec2Service.getInstanceStatus(id);
  }

  /**
   * Start an EC2 instance
   */
  @Post('start/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start an EC2 instance' })
  @ApiParam({
    name: 'id',
    description: 'EC2 instance ID',
    example: 'i-0123456789abcdef0',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Instance start initiated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Instance not found',
  })
  async startInstance(@Param('id') id: string) {
    return this.ec2Service.startInstance(id);
  }

  /**
   * Stop an EC2 instance
   */
  @Post('stop/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stop an EC2 instance' })
  @ApiParam({
    name: 'id',
    description: 'EC2 instance ID',
    example: 'i-0123456789abcdef0',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Instance stop initiated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Instance not found',
  })
  async stopInstance(@Param('id') id: string) {
    return this.ec2Service.stopInstance(id);
  }

  /**
   * Terminate an EC2 instance
   */
  @Post('terminate/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminate an EC2 instance' })
  @ApiParam({
    name: 'id',
    description: 'EC2 instance ID',
    example: 'i-0123456789abcdef0',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Instance termination initiated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Instance not found',
  })
  async terminateInstance(@Param('id') id: string) {
    return this.ec2Service.terminateInstance(id);
  }

  /**
   * Launch a new EC2 instance
   */
  @Post('launch')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Launch a new EC2 instance' })
  @ApiBody({ type: LaunchInstanceDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Instance launched successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Failed to launch instance',
  })
  async launchInstance(
    @Body(new ValidationPipe({ transform: true })) dto: LaunchInstanceDto,
  ) {
    return this.ec2Service.launchInstance(dto);
  }

  /**
   * Add tags to an EC2 instance
   */
  @Post(':id/tags')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add tags to an EC2 instance' })
  @ApiParam({
    name: 'id',
    description: 'EC2 instance ID',
    example: 'i-0123456789abcdef0',
  })
  @ApiBody({
    description: 'Tags to add to the instance',
    schema: {
      type: 'object',
      example: {
        Name: 'Production Server',
        Environment: 'Production',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tags added successfully',
  })
  async addTags(@Param('id') id: string, @Body() tags: Record<string, string>) {
    return this.ec2Service.addTags(id, tags);
  }
}
