import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { GeneratedPlanDto } from './create-planner.dto';

export class UpdatePlannerDto extends GeneratedPlanDto {}
