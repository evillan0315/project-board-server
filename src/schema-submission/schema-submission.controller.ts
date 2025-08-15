import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

import { SchemaSubmissionService } from './schema-submission.service';
import {
  CreateSchemaSubmissionDto,
  PaginationSchemaSubmissionResultDto,
  PaginationSchemaSubmissionQueryDto,
} from './dto/create-schema-submission.dto';
import { UpdateSchemaSubmissionDto } from './dto/update-schema-submission.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('SchemaSubmission')
@Controller('api/schema-submission')
export class SchemaSubmissionController {
  constructor(
    private readonly schemaSubmissionService: SchemaSubmissionService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new SchemaSubmission' })
  @ApiCreatedResponse({
    description: 'Successfully created.',
    type: CreateSchemaSubmissionDto,
  })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  create(@Body() dto: CreateSchemaSubmissionDto) {
    return this.schemaSubmissionService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Retrieve all SchemaSubmission records' })
  @ApiOkResponse({
    description: 'List of SchemaSubmission records.',
    type: [CreateSchemaSubmissionDto],
  })
  findAll() {
    return this.schemaSubmissionService.findAll();
  }

  @Get('paginated')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Paginated SchemaSubmission records' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated results',
    type: PaginationSchemaSubmissionResultDto,
  })
  findAllPaginated(@Query() query: PaginationSchemaSubmissionQueryDto) {
    return this.schemaSubmissionService.findAllPaginated(query);
  }

  @Get('by-schema-user')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get submissions by schemaId and submittedById' })
  @ApiQuery({ name: 'schemaId', required: true, description: 'Schema ID' })
  @ApiQuery({
    name: 'submittedById',
    required: true,
    description: 'User ID who submitted',
  })
  @ApiOkResponse({
    description: 'Matching submissions found.',
    type: [CreateSchemaSubmissionDto],
  })
  @ApiBadRequestResponse({ description: 'Missing or invalid parameters.' })
  async findBySchemaAndUser(
    @Query('schemaId') schemaId: string,
    @Query('submittedById') submittedById: string,
  ) {
    if (!schemaId || !submittedById) {
      throw new BadRequestException('schemaId and submittedById are required.');
    }
    return this.schemaSubmissionService.findBySchemaAndUser(
      schemaId,
      submittedById,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Find SchemaSubmission by ID' })
  @ApiOkResponse({
    description: 'Record found.',
    type: CreateSchemaSubmissionDto,
  })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  findOne(@Param('id') id: string) {
    return this.schemaSubmissionService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update SchemaSubmission by ID' })
  @ApiOkResponse({
    description: 'Successfully updated.',
    type: UpdateSchemaSubmissionDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid data.' })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  update(@Param('id') id: string, @Body() dto: UpdateSchemaSubmissionDto) {
    return this.schemaSubmissionService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete SchemaSubmission by ID' })
  @ApiOkResponse({ description: 'Successfully deleted.' })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  remove(@Param('id') id: string) {
    return this.schemaSubmissionService.remove(id);
  }
}
