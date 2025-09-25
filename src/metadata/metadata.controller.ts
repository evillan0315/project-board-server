import {
  Controller,
  Get,
  Post,
  Res,
  Req,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  HttpStatus,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiQuery,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import axios from 'axios';

import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

import { MetadataService } from './metadata.service';
import {
  CreateMetadataDto,
  PaginationMetadataResultDto,
  PaginationMetadataQueryDto,
} from './dto/create-metadata.dto';
import { UpdateMetadataDto } from './dto/update-metadata.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Metadata')
@Controller('api/metadata')
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  // ───────────────────────────────────────────────────────────
  // CREATE
  // ───────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new Metadata' })
  @ApiCreatedResponse({
    description: 'Successfully created.',
    type: CreateMetadataDto,
  })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  create(@Body() dto: CreateMetadataDto) {
    return this.metadataService.create(dto);
  }

  // ───────────────────────────────────────────────────────────
  // FIND ALL
  // ───────────────────────────────────────────────────────────

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Retrieve all Metadata records' })
  @ApiOkResponse({
    description: 'List of Metadata records.',
    type: [CreateMetadataDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  findAll() {
    return this.metadataService.findAll();
  }

  // ───────────────────────────────────────────────────────────
  // PAGINATED
  // ───────────────────────────────────────────────────────────

  @Get('paginated')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Paginated Metadata records' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated results',
    type: PaginationMetadataResultDto,
  })
  findAllPaginated(@Query() query: PaginationMetadataQueryDto) {
    return this.metadataService.findAllPaginated(query);
  }

  // ───────────────────────────────────────────────────────────
  // FIND ONE
  // ───────────────────────────────────────────────────────────

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Find Metadata by ID' })
  @ApiOkResponse({ description: 'Record found.', type: CreateMetadataDto })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  findOne(@Param('id') id: string) {
    return this.metadataService.findOne(id);
  }

  // ───────────────────────────────────────────────────────────
  // UPDATE
  // ───────────────────────────────────────────────────────────

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update Metadata by ID' })
  @ApiOkResponse({
    description: 'Successfully updated.',
    type: UpdateMetadataDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid data.' })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  update(@Param('id') id: string, @Body() dto: UpdateMetadataDto) {
    return this.metadataService.update(id, dto);
  }

  // ───────────────────────────────────────────────────────────
  // DELETE
  // ───────────────────────────────────────────────────────────

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete Metadata by ID' })
  @ApiOkResponse({ description: 'Successfully deleted.' })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  remove(@Param('id') id: string) {
    return this.metadataService.remove(id);
  }
}
