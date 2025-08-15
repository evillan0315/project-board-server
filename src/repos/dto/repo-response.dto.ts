 import { ApiProperty } from '@nestjs/swagger';

export class RepoResponseDto {
  @ApiProperty({ description: 'The GitHub ID of the repository', example: 123456789 })
  id: number;

  @ApiProperty({ description: 'The name of the repository', example: 'oauth-repo-test' })
  name: string;

  @ApiProperty({ description: 'The full name including owner (e.g., octocat/oauth-repo-test)', example: 'octocat/oauth-repo-test' })
  full_name: string;

  @ApiProperty({ description: 'The owner of the repository', example: 'octocat' })
  owner: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
  };

  @ApiProperty({ description: 'A short description of the repository', example: 'A NestJS project' })
  description?: string | null;

  @ApiProperty({ description: 'URL to the repository on GitHub', example: 'https://github.com/octocat/oauth-repo-test' })
  html_url: string;

  @ApiProperty({ description: 'Whether the repository is private or public', example: false })
  private: boolean;

  @ApiProperty({ description: 'The date and time the repository was created', example: '2023-10-27T10:00:00Z' })
  created_at: string;

  @ApiProperty({ description: 'The date and time the repository was last updated', example: '2023-10-27T11:30:00Z' })
  updated_at: string;

  @ApiProperty({ description: 'The date and time the repository was last pushed to', example: '2023-10-27T11:30:00Z' })
  pushed_at: string;
}
