import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ApplyExistingPlanRequestDto {
  @ApiProperty({ description: 'The ID of the plan to apply.' })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiPropertyOptional({
    description: 'Optional project root path to apply the plan to. If not provided, uses the default configured path.',
    example: '/path/to/my/project',
  })
  @IsOptional()
  @IsString()
  projectRoot?: string;
}
