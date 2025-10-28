// FilePath: src/proxy/proxy.module.ts
// Title: Proper NestJS ProxyModule configuration
// Reason: Ensure HttpService and Axios providers are correctly registered via HttpModule

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProxyService } from './proxy.service';
import { ProxyController } from './proxy.controller';

@Module({
  imports: [HttpModule],
  providers: [ProxyService],
  controllers: [ProxyController],
  exports: [ProxyService],
})
export class ProxyModule {}
