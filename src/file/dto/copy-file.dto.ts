import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CopyFileDto {
  @ApiProperty({
    description: 'The path of the file or folder to copy',
    example: '/path/to/source/file.txt',
  })
  @IsString()
  @IsNotEmpty()
  sourcePath: string;

  @ApiProperty({
    description:
      'The destination path where the file or folder will be copied (including the new name if different)',
    example: '/path/to/destination/new-file.txt',
  })
  @IsString()
  @IsNotEmpty()
  destinationPath: string;
}

export class CopyFileResponseDto {
  @ApiProperty({
    description: 'Indicates if the copy operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'A message describing the result of the operation',
    example:
      'Successfully copied "/path/to/source/file.txt" to "/path/to/destination/new-file.txt"',
  })
  message: string;

  @ApiProperty({
    description: 'The original source path of the file or folder',
    example: '/path/to/source/file.txt',
  })
  sourcePath: string;

  @ApiProperty({
    description: 'The destination path of the copied file or folder',
    example: '/path/to/destination/new-file.txt',
  })
  destinationPath: string;
}
