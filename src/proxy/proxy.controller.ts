import { Controller, Get, Query, Res, Req, UsePipes, ValidationPipe, HttpStatus } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { Request, Response } from 'express';
import { ProxyUrlDto } from './dto/proxy-url.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBadRequestResponse } from '@nestjs/swagger';

@ApiTags('Proxy')
@Controller('api/proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get()
  @ApiOperation({ summary: 'Proxies an external URL, streams its content, and applies security headers.' })
  @ApiQuery({ name: 'url', type: String, description: 'The external URL to proxy (must be http or https).' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully proxied content.' })
  @ApiBadRequestResponse({ description: 'Invalid or missing target URL, or domain not permitted.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error during proxy operation.' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async proxy(@Query() query: ProxyUrlDto, @Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyUrl(query, req, res);
  }
}
