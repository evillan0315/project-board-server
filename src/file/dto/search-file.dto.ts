import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SearchFileDto {
  @ApiProperty({
    description:
      'The root directory to start the search (defaults to current working directory)',
    example: '/path/to/start',
    required: false,
  })
  @IsString()
  @IsOptional()
  directory?: string;

  @ApiProperty({
    description:
      'The name or part of the name of the file/folder to search for',
    example: 'report',
  })
  @IsString()
  @IsNotEmpty()
  searchTerm: string;
}
