import { Module } from '@nestjs/common';
import { JsonFixService } from './json-fix.service';
import { JsonFixController } from './json-fix.controller';

@Module({
  providers: [JsonFixService],
  controllers: [JsonFixController]
})
export class JsonFixModule {}
