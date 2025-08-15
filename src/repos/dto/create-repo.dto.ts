 import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength, MinLength, IsBoolean } from 'class-validator';

export class CreateRepoDto {
  @ApiProperty({
    description: 'The name of the repository',
    example: 'oauth-repo-test',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'A short description of the repository',
    required: false,
    example: 'A repository created via NestJS GitHub OAuth.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Whether the repository should be private (true) or public (false)',
    required: false,
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  private?: boolean = false;
}
