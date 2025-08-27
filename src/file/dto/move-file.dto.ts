import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class MoveFileDto {
  @ApiProperty({
    description: 'The current path of the file or folder to move',
    example: '/path/to/old/file.txt',
  })
  @IsString()
  @IsNotEmpty()
  sourcePath: string;

  @ApiProperty({
    description:
      'The destination path where the file or folder will be moved (including the new name if different)',
    example: '/path/to/new/location/file.txt',
  })
  @IsString()
  @IsNotEmpty()
  destinationPath: string;
}

export class MoveFileResponseDto {
  @ApiProperty({
    description: 'Indicates if the move operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'A message describing the result of the operation',
    example: 'Successfully moved "/path/to/old/file.txt" to "/path/to/new/location/file.txt"',
  })
  message: string;

  @ApiProperty({
    description: 'The original source path of the file or folder',
    example: '/path/to/old/file.txt',
  })
  sourcePath: string;

  @ApiProperty({
    description: 'The destination path of the moved file or folder',
    example: '/path/to/new/location/file.txt',
  })
  destinationPath: string;
}
