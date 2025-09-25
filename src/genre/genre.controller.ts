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

import { GenreService } from './genre.service';
import {
  CreateGenreDto,
  PaginationGenreResultDto,
  PaginationGenreQueryDto,
} from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';

@ApiTags('Genre')
@Controller('api/genre')
export class GenreController {
  constructor(private readonly genreService: GenreService) {}

  // ───────────────────────────────────────────────────────────
  // CREATE
  // ───────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a new Genre' })
  @ApiCreatedResponse({
    description: 'Successfully created.',
    type: CreateGenreDto,
  })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  create(@Body() dto: CreateGenreDto) {
    return this.genreService.create(dto);
  }

  // ───────────────────────────────────────────────────────────
  // FIND ALL
  // ───────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Retrieve all Genre records' })
  @ApiOkResponse({
    description: 'List of Genre records.',
    type: [CreateGenreDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  findAll() {
    return this.genreService.findAll();
  }

  // ───────────────────────────────────────────────────────────
  // PAGINATED
  // ───────────────────────────────────────────────────────────

  @Get('paginated')
  @ApiOperation({ summary: 'Paginated Genre records' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated results',
    type: PaginationGenreResultDto,
  })
  findAllPaginated(@Query() query: PaginationGenreQueryDto) {
    return this.genreService.findAllPaginated(query);
  }

  // ───────────────────────────────────────────────────────────
  // FIND ONE
  // ───────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Find Genre by ID' })
  @ApiOkResponse({ description: 'Record found.', type: CreateGenreDto })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  findOne(@Param('id') id: string) {
    return this.genreService.findOne(id);
  }

  // ───────────────────────────────────────────────────────────
  // UPDATE
  // ───────────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({ summary: 'Update Genre by ID' })
  @ApiOkResponse({ description: 'Successfully updated.', type: UpdateGenreDto })
  @ApiBadRequestResponse({ description: 'Invalid data.' })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  update(@Param('id') id: string, @Body() dto: UpdateGenreDto) {
    return this.genreService.update(id, dto);
  }

  // ───────────────────────────────────────────────────────────
  // DELETE
  // ───────────────────────────────────────────────────────────

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Genre by ID' })
  @ApiOkResponse({ description: 'Successfully deleted.' })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  remove(@Param('id') id: string) {
    return this.genreService.remove(id);
  }
}
