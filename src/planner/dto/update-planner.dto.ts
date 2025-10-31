import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { GeneratedPlanDto } from './create-planner.dto';

export class UpdatePlannerDto extends GeneratedPlanDto {
  @ApiProperty({ description: 'ID of the plan to update.' })
  @IsString()
  @IsOptional()
  planId?: string;
}
