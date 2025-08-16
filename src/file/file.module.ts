import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileService } from './file.service';
import { FileLanguageService } from './file-language.service';
import { FileController } from './file.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UtilsModule } from '../utils/utils.module';

import { FileValidationService } from '../common/services/file-validation.service';
import { ModuleControlModule } from '../module-control/module-control.module';
import { FileGateway } from './file.gateway';
import { RemoteFileService } from './remote-file/remote-file.service';
import { RemoteFileController } from './remote-file/remote-file.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // makes ConfigService available app-wide
    }),
    PrismaModule,
    UtilsModule,
    ConfigModule,
    ModuleControlModule,
  ],
  controllers: [FileController, RemoteFileController],
  providers: [
    FileService,
    FileLanguageService,
    FileValidationService,
    {
      provide: 'EXCLUDED_FOLDERS',
      useValue: [
        'lost+found',
        'proc',
        'sys',
        'dev',
        'root',
        'node_modules',
        '.git',
      ],
    },
    FileGateway,
    RemoteFileService,
  ],
  exports: [FileService],
})
export class FileModule {}
