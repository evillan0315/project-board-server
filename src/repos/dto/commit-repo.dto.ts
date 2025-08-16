import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CommitRepoDto {
  @ApiProperty({
    description: 'The commit message for the file change',
    example: 'feat: add initial oauth commit-log file',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  message: string;
}
