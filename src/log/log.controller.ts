import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { LogService } from './log.service';
import { CreateLogDto } from './dto/create-log.dto';
import { UpdateLogDto } from './dto/update-log.dto';

@ApiTags('Log')
@Controller('api/log')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new log' })
  @ApiCreatedResponse({
    description: 'Log successfully created.',
    schema: {
      example: {
        id: 'abc123',
        type: 'SYSTEM',
        level: 'INFO',
        tags: ['system'],
        data: { message: 'System initialized' },
        createdAt: '2025-06-19T12:00:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiForbiddenResponse({ description: 'Log module is disabled' })
  @ApiBody({ type: CreateLogDto })
  create(@Body() dto: CreateLogDto) {
    return this.logService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all logs' })
  @ApiOkResponse({
    description: 'List of logs retrieved successfully.',
    schema: {
      type: 'array',
      items: { $ref: '#/components/schemas/CreateLogDto' },
    },
  })
  @ApiForbiddenResponse({ description: 'Log module is disabled' })
  findAll() {
    return this.logService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find log by ID' })
  @ApiOkResponse({
    description: 'Log found.',
    schema: {
      $ref: '#/components/schemas/CreateLogDto',
    },
  })
  @ApiNotFoundResponse({ description: 'Log not found.' })
  @ApiForbiddenResponse({ description: 'Log module is disabled' })
  findOne(@Param('id') id: string) {
    return this.logService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update log by ID' })
  @ApiOkResponse({
    description: 'Log updated successfully.',
    schema: {
      $ref: '#/components/schemas/CreateLogDto',
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid update data' })
  @ApiNotFoundResponse({ description: 'Log not found.' })
  @ApiForbiddenResponse({ description: 'Log module is disabled' })
  update(@Param('id') id: string, @Body() dto: UpdateLogDto) {
    return this.logService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete log by ID' })
  @ApiOkResponse({ description: 'Log deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Log not found.' })
  @ApiForbiddenResponse({ description: 'Log module is disabled' })
  remove(@Param('id') id: string) {
    return this.logService.remove(id);
  }
}
