import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { CreatePlannerDto } from './create-planner.dto';

export class UpdatePlannerDto extends CreatePlannerDto {}
