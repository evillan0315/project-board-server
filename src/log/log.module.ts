import { Module } from '@nestjs/common';
import { LogInterceptor } from './log.interceptor';
import { LogController } from './log.controller';
import { LogService } from './log.service';
import { ModuleControlModule } from '../module-control/module-control.module';
import { PrismaModule } from '../prisma/prisma.module';
import { LogGateway } from './log.gateway';

@Module({
  imports: [PrismaModule, ModuleControlModule],
  controllers: [LogController],
  providers: [
    LogService,
    LogGateway,
    {
      provide: 'APP_INTERCEPTOR',
      useClass: LogInterceptor,
    },
  ],
  exports: [LogService],
})
export class LogModule {}
