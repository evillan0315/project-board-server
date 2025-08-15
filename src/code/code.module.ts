import { Module } from '@nestjs/common';
import { CodeService } from './code.service';
import { CodeController } from './code.controller';
import { CodeGeneratorService } from './code-generator/code-generator.service';

@Module({
  providers: [CodeService, CodeGeneratorService],
  controllers: [CodeController],
})
export class CodeModule {}
