import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { BulkDataService } from './bulk-data.service';
import { BulkDataController } from './bulk-data.controller';
import { PrismaModule } from '../prisma/prisma.module';
@Module({
  imports: [PrismaModule, MulterModule.register({
      dest: './uploads', // Temporary directory for file uploads
      // Or configure more advanced storage options for production
    })],
  providers: [BulkDataService],
  controllers: [BulkDataController]
})
export class BulkDataModule {}
