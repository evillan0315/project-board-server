import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RenameFileDto {
  @ApiProperty({
    description: 'The current path of the file or folder to rename',
    example: '/path/to/old-file.txt',
  })
  @IsString()
  @IsNotEmpty()
  oldPath: string;

  @ApiProperty({
    description: 'The new desired path (including the new name)',
    example: '/path/to/new-file.txt',
  })
  @IsString()
  @IsNotEmpty()
  newPath: string;
}

export class RenameFileResponseDto {
  @ApiProperty({
    description: 'Indicates if the rename operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'A message describing the result of the operation',
    example:
      'Successfully renamed "/path/to/old-file.txt" to "/path/to/new-file.txt"',
  })
  message: string;

  @ApiProperty({
    description: 'The original path of the file or folder',
    example: '/path/to/old-file.txt',
  })
  oldPath: string;

  @ApiProperty({
    description: 'The new path of the file or folder',
    example: '/path/to/new-file.txt',
  })
  newPath: string;
}
