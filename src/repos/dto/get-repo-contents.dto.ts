// src/repos/dto/get-repo-contents.dto.ts
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetRepoContentsDto {
  @ApiPropertyOptional({
    description:
      'The content path. For example: `src/main.ts` or `docs`. If omitted, the root directory contents are returned.',
    type: String,
    example: 'src/config',
  })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({
    description:
      'The name of the commit, branch, or tag. Default: the repository’s default branch (usually `main` or `master`).',
    type: String,
    example: 'my-feature-branch',
  })
  @IsOptional()
  @IsString()
  ref?: string; // Branch name, tag, or commit SHA
}
