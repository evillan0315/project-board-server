import { Module } from '@nestjs/common';
import { SchemaSubmissionService } from './schema-submission.service';
import { SchemaSubmissionController } from './schema-submission.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ModuleControlModule } from '../module-control/module-control.module';
@Module({
  imports: [PrismaModule, ModuleControlModule],
  controllers: [SchemaSubmissionController],
  providers: [SchemaSubmissionService],
})
export class SchemaSubmissionModule {}
