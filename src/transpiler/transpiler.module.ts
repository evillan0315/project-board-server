import { Module } from '@nestjs/common';
import { TranspilerService } from './transpiler.service';
import { TranspilerController } from './transpiler.controller';

@Module({
  providers: [TranspilerService],
  controllers: [TranspilerController],
})
export class TranspilerModule {}
