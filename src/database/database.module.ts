import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { DatabaseController } from './database.controller';
//import { PostgresModule } from './postgres/postgres.module';

@Module({
  //imports: [PostgresModule],
  providers: [DatabaseService],
  controllers: [DatabaseController],
})
export class DatabaseModule {}
