import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';
import { GetTablesQueryDto } from './dto/get-tables-query.dto';
import { GetTableColumnsQueryDto } from './dto/get-table-columns-query.dto';
import { ColumnMetadataDto } from './dto/column-metadata.dto';
import { CreateTableDto } from './dto/create-table.dto';
import { TableInfo } from './database.service';
import { ExecuteSqlDto } from './dto/execute-sql.dto';

import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Database')
@Controller('api/database')
export class DatabaseController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  @Get('tables')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all tables and their columns' })
  @ApiQuery({
    name: 'connectionString',
    description:
      'Optional custom database connection string. Defaults to DATABASE_URL if omitted.',
    required: false,
    example: 'postgresql://postgres:password@localhost:5432/mydb',
  })
  @ApiQuery({
    name: 'dbType',
    enum: ['postgres', 'mysql', 'mongodb'],
    required: true,
    description: 'Type of database',
    example: 'postgres',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tables with column metadata',
    schema: {
      example: [
        {
          tableName: 'users',
          columns: [
            {
              column_name: 'id',
              data_type: 'integer',
              is_nullable: 'NO',
              column_default: "nextval('users_id_seq'::regclass)",
            },
            {
              column_name: 'email',
              data_type: 'text',
              is_nullable: 'NO',
              column_default: null,
            },
          ],
        },
      ],
    },
  })
  async getTables(@Query() query: GetTablesQueryDto): Promise<TableInfo[]> {
    const connectionString =
      query.connectionString || this.configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new BadRequestException('Connection string is required.');
    }

    return this.databaseService.getAllTables(connectionString, query.dbType);
  }
  @Post('create-table')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new table' })
  @ApiResponse({ status: 201, description: 'Table created successfully' })
  @ApiBody({
    type: CreateTableDto,
    examples: {
      example1: {
        summary: 'Create users table',
        value: {
          connectionString:
            'postgresql://postgres:password@localhost:5432/mydb',
          dbType: 'postgres', // added dbType here
          tableName: 'users',
          columns: [
            { columnName: 'id', dataType: 'SERIAL PRIMARY KEY' },
            { columnName: 'email', dataType: 'TEXT NOT NULL' },
            {
              columnName: 'created_at',
              dataType: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            },
          ],
        },
      },
    },
  })
  async createTable(@Body() dto: CreateTableDto): Promise<string> {
    return this.databaseService.createTable(dto);
  }

  @Get('columns')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all columns from a specific table with optional filters',
  })
  @ApiQuery({
    name: 'connectionString',
    description: 'PostgreSQL connection string',
    required: false,
    example: 'postgresql://postgres:password@localhost:5432/mydb',
  })
  @ApiQuery({
    name: 'tableName',
    description: 'Name of the table to query columns from',
    required: true,
    example: 'users',
  })
  @ApiQuery({
    name: 'columnName',
    description: 'Filter by column name (optional)',
    required: false,
    example: 'email',
  })
  @ApiQuery({
    name: 'dataType',
    description: 'Filter by data type (optional)',
    required: false,
    example: 'text',
  })
  @ApiQuery({
    name: 'isNullable',
    description: 'Filter by nullable status (optional)',
    required: false,
    example: 'NO',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of column metadata matching filters',
    type: ColumnMetadataDto,
    isArray: true,
    schema: {
      example: [
        {
          column_name: 'id',
          data_type: 'integer',
          is_nullable: 'NO',
          column_default: "nextval('users_id_seq'::regclass)",
        },
        {
          column_name: 'email',
          data_type: 'text',
          is_nullable: 'NO',
          column_default: null,
        },
      ],
    },
  })
  async getTableColumns(@Query() query: GetTableColumnsQueryDto) {
    const {
      connectionString: providedConnectionString,
      tableName,
      columnName,
      dataType,
      isNullable,
    } = query;

    const connectionString =
      providedConnectionString ||
      this.configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new BadRequestException('Connection string is required.');
    }

    return this.databaseService.getTableColumns(connectionString, tableName, {
      columnName,
      dataType,
      isNullable,
    });
  }

  @Post('execute')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Execute raw SQL against the target database' })
  @ApiBody({
    type: ExecuteSqlDto,
    examples: {
      validQuery: {
        summary: 'Example of a SELECT query on the Documentation table',
        value: {
          sql: 'SELECT * FROM "Documentation";',
          connectionString:
            'postgresql://postgres:postgres@localhost:5432/appdb',
          dbType: 'postgres',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'SQL execution result' })
  async executeSql(@Body() dto: ExecuteSqlDto) {
    return this.databaseService.executeSql(dto);
  }
}
