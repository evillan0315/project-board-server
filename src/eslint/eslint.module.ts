// src/eslint/eslint.module.ts
import { Module } from '@nestjs/common';
import { EslintService } from './eslint.service';
import { EslintController } from './eslint.controller';

@Module({
  providers: [EslintService],
  controllers: [EslintController],
  exports: [EslintService],
})
export class EslintModule {}
