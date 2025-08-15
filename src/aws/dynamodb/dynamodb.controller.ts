import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DynamodbService } from './dynamodb.service';
import { StoreCommandDto } from './dto/store-command.dto';

import { JwtAuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('AWS')
@Controller('api/aws/dynamodb')
export class DynamodbController {
  constructor(private readonly dynamoDBService: DynamodbService) {}

  @Post('store-command')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Store a command in DynamoDB' })
  @ApiResponse({ status: 201, description: 'Command stored successfully' })
  async storeCommand(
    @Body() body: StoreCommandDto,
    //@CurrentUser() user: UserPayload,
  ) {
    const { command } = body;
    //const { sub: cognitoId, username } = user;
    // await this.dynamoDBService.storeCommand(command, cognitoId, username);
    return { message: 'Command stored successfully' };
  }

  @Get('stored-commands')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Retrieve stored commands from DynamoDB' })
  @ApiResponse({
    status: 200,
    description: 'Stored commands retrieved successfully',
  })
  async getStoredCommands() {
    return await this.dynamoDBService.getStoredCommands();
  }

  @Post('create-table')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new DynamoDB table' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tableName: { type: 'string' },
        keySchema: { type: 'array', items: { type: 'object' } },
        attributeDefinitions: { type: 'array', items: { type: 'object' } },
        provisionedThroughput: {
          type: 'object',
          properties: {
            ReadCapacityUnits: { type: 'number' },
            WriteCapacityUnits: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Table created successfully' })
  async createTable(
    @Body('tableName') tableName: string,
    @Body('keySchema') keySchema: any,
    @Body('attributeDefinitions') attributeDefinitions: any,
    @Body('provisionedThroughput') provisionedThroughput: any,
  ) {
    await this.dynamoDBService.createTable(
      tableName,
      keySchema,
      attributeDefinitions,
      provisionedThroughput,
    );
    return { message: `Table ${tableName} created successfully` };
  }
  @Get('list-tables')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'List all DynamoDB tables' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved table names',
  })
  async listTables() {
    return await this.dynamoDBService.listTables();
  }
  @Get('list-data/:tableName')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'List all stored data for a specific table' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved data' })
  async listTableData(@Param('tableName') tableName: string) {
    return await this.dynamoDBService.listTableData(tableName);
  }
}
