import { Module } from '@nestjs/common';
import { MetadataService } from './metadata.service';
import { MetadataController } from './metadata.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ModuleControlModule } from '../module-control/module-control.module';
@Module({
  imports: [PrismaModule, ModuleControlModule],
  controllers: [MetadataController],
  providers: [MetadataService],
})
export class MetadataModule {}
