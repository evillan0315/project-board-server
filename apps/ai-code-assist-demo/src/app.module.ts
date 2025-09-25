import { Module } from '@nestjs/common';
import { PlannerModule } from './planner/planner.module';

@Module({
  imports: [PlannerModule],
  controllers: [],
  providers: []
})
export class AppModule {}
