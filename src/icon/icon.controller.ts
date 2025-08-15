// src/icon/icon.controller.ts
import {
  Controller,
  Get,
  Query,
  Param,
  Res,
  NotFoundException,
  ParseIntPipe,
  DefaultValuePipe,
  Post,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { IconService } from './icon.service';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Icons')
@Controller('api/icon')
export class IconController {
  constructor(private readonly iconService: IconService) {}
  @Post('download/prefix')
  @ApiOperation({
    summary: 'Download all icons for a given prefix from Iconify',
  })
  @ApiBody({
    description: 'Prefix name to download all icons for',
    schema: {
      type: 'object',
      required: ['prefix'],
      properties: {
        prefix: {
          type: 'string',
          example: 'mdi',
          description: 'Icon set prefix (e.g., mdi, tabler, carbon)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Icons downloaded successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'mdi:home' },
          status: { type: 'string', example: 'success' },
          path: { type: 'string', example: '/icons/mdi/home.svg' },
          error: { type: 'string', nullable: true },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Prefix is required' })
  async downloadByPrefix(@Body() body: { prefix: string }) {
    if (!body.prefix) {
      throw new BadRequestException('Prefix is required');
    }

    return this.iconService.downloadAllFromPrefix(body.prefix);
  }
  @Get('download')
  @ApiOperation({ summary: 'Download icons from Iconify and store locally' })
  @ApiQuery({ name: 'name', type: String, required: true, isArray: true })
  async download(@Query('name') names: string | string[]) {
    const list = Array.isArray(names) ? names : [names];
    return this.iconService.downloadIconsBatch(list);
  }

  @Get('list')
  @ApiOperation({
    summary: 'List downloaded icons with pagination and sorting',
  })
  @ApiQuery({ name: 'prefix', required: false })
  @ApiQuery({ name: 'sort', enum: ['prefix', 'name'], required: false })
  @ApiQuery({ name: 'order', enum: ['asc', 'desc'], required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async list(
    @Query('prefix') prefix?: string,
    @Query('sort') sort: 'prefix' | 'name' = 'name',
    @Query('order') order: 'asc' | 'desc' = 'asc',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    return this.iconService.listIcons(prefix, sort, order, page, limit);
  }

  @Get(':prefix/:name')
  @ApiOperation({ summary: 'Get individual icon SVG content' })
  @ApiParam({ name: 'prefix', description: 'Icon prefix (e.g. mdi)' })
  @ApiParam({ name: 'name', description: 'Icon name (e.g. home)' })
  async getIcon(
    @Param('prefix') prefix: string,
    @Param('name') name: string,
    @Res() res: Response,
  ) {
    try {
      const content = this.iconService.getIconContent(prefix, name);
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(content);
    } catch (e) {
      throw new NotFoundException(`Icon ${prefix}:${name} not found`);
    }
  }
}
