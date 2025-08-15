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

import { GeminiRequestService } from './gemini-request.service';
import {
  CreateGeminiRequestDto,
  PaginationGeminiRequestResultDto,
  PaginationGeminiRequestQueryDto,
} from './dto/create-gemini-request.dto';
import { UpdateGeminiRequestDto } from './dto/update-gemini-request.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('GeminiRequest')
@Controller('api/gemini-request')
export class GeminiRequestController {
  constructor(private readonly geminiRequestService: GeminiRequestService) {}

  // ───────────────────────────────────────────────────────────
  // CREATE
  // ───────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new GeminiRequest' })
  @ApiCreatedResponse({
    description: 'Successfully created.',
    type: CreateGeminiRequestDto,
  })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  create(@Body() dto: CreateGeminiRequestDto) {
    return this.geminiRequestService.create(dto);
  }

  // ───────────────────────────────────────────────────────────
  // FIND ALL
  // ───────────────────────────────────────────────────────────

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Retrieve all GeminiRequest records' })
  @ApiOkResponse({
    description: 'List of GeminiRequest records.',
    type: [CreateGeminiRequestDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  findAll() {
    return this.geminiRequestService.findAll();
  }

  // ───────────────────────────────────────────────────────────
  // PAGINATED
  // ───────────────────────────────────────────────────────────

  @Get('paginated')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Paginated GeminiRequest records' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated results',
    type: PaginationGeminiRequestResultDto,
  })
  findAllPaginated(@Query() query: PaginationGeminiRequestQueryDto) {
    return this.geminiRequestService.findAllPaginated(query);
  }

  // ───────────────────────────────────────────────────────────
  // FIND ONE
  // ───────────────────────────────────────────────────────────

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Find GeminiRequest by ID' })
  @ApiOkResponse({ description: 'Record found.', type: CreateGeminiRequestDto })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  findOne(@Param('id') id: string) {
    return this.geminiRequestService.findOne(id);
  }

  // ───────────────────────────────────────────────────────────
  // UPDATE
  // ───────────────────────────────────────────────────────────

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update GeminiRequest by ID' })
  @ApiOkResponse({
    description: 'Successfully updated.',
    type: UpdateGeminiRequestDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid data.' })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  update(@Param('id') id: string, @Body() dto: UpdateGeminiRequestDto) {
    return this.geminiRequestService.update(id, dto);
  }

  // ───────────────────────────────────────────────────────────
  // DELETE
  // ───────────────────────────────────────────────────────────

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete GeminiRequest by ID' })
  @ApiOkResponse({ description: 'Successfully deleted.' })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  remove(@Param('id') id: string) {
    return this.geminiRequestService.remove(id);
  }
}
