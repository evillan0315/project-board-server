import { Controller, Get, Query, Res, Req } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { Request, Response } from 'express';

@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get()
  async proxy(@Query('url') url: string, @Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyUrl(url, req, res);
  }
}
