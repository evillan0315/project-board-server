import { ApiProperty } from '@nestjs/swagger';

export class SearchFileResponseDto {
  @ApiProperty({
    description: 'Name of the file or folder',
    example: 'report.txt',
  })
  name: string;

  @ApiProperty({
    description: 'Full path of the file or folder',
    example: '/path/to/report.txt',
  })
  path: string;

  @ApiProperty({
    description: 'Indicates if the item is a directory',
    example: false,
  })
  isDirectory: boolean;

  @ApiProperty({
    description: 'Type of the item: file or folder',
    example: 'file',
    enum: ['file', 'folder'],
  })
  type: 'file' | 'folder';
}
