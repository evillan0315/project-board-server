import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsString, IsOptional } from 'class-validator';

export class FileOperationResultDto {
  @ApiProperty({
    description: 'Indicates if the file operation was successful.',
  })
  @IsBoolean()
  success!: boolean;

  @ApiPropertyOptional({
    description: 'A message detailing the result of the operation.',
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({
    description:
      'The path of the file after the operation (e.g., for rename/move).',
  })
  @IsOptional()
  @IsString()
  filePath?: string;
}
