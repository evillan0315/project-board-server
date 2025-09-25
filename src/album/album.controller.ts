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

import { AlbumService } from './album.service';
import {
  CreateAlbumDto,
  PaginationAlbumResultDto,
  PaginationAlbumQueryDto,
} from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Album')
@Controller('api/album')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  // ───────────────────────────────────────────────────────────
  // CREATE
  // ───────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new Album' })
  @ApiCreatedResponse({
    description: 'Successfully created.',
    type: CreateAlbumDto,
  })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  create(@Body() dto: CreateAlbumDto) {
    return this.albumService.create(dto);
  }

  // ───────────────────────────────────────────────────────────
  // FIND ALL
  // ───────────────────────────────────────────────────────────

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Retrieve all Album records' })
  @ApiOkResponse({
    description: 'List of Album records.',
    type: [CreateAlbumDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  findAll() {
    return this.albumService.findAll();
  }

  // ───────────────────────────────────────────────────────────
  // PAGINATED
  // ───────────────────────────────────────────────────────────

  @Get('paginated')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Paginated Album records' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated results',
    type: PaginationAlbumResultDto,
  })
  findAllPaginated(@Query() query: PaginationAlbumQueryDto) {
    return this.albumService.findAllPaginated(query);
  }

  // ───────────────────────────────────────────────────────────
  // FIND ONE
  // ───────────────────────────────────────────────────────────

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Find Album by ID' })
  @ApiOkResponse({ description: 'Record found.', type: CreateAlbumDto })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  findOne(@Param('id') id: string) {
    return this.albumService.findOne(id);
  }

  // ───────────────────────────────────────────────────────────
  // UPDATE
  // ───────────────────────────────────────────────────────────

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update Album by ID' })
  @ApiOkResponse({ description: 'Successfully updated.', type: UpdateAlbumDto })
  @ApiBadRequestResponse({ description: 'Invalid data.' })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  update(@Param('id') id: string, @Body() dto: UpdateAlbumDto) {
    return this.albumService.update(id, dto);
  }

  // ───────────────────────────────────────────────────────────
  // DELETE
  // ───────────────────────────────────────────────────────────

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete Album by ID' })
  @ApiOkResponse({ description: 'Successfully deleted.' })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  remove(@Param('id') id: string) {
    return this.albumService.remove(id);
  }
}
