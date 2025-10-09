import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreateSnapshotDto {
  @ApiProperty({ description: 'Name of the snapshot (Git tag) to create' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_\-]+$/, { message: 'Snapshot name must be alphanumeric, dashes, or underscores' })
  snapshotName: string;

  @ApiPropertyOptional({ description: 'Optional message for the snapshot tag' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Optional project root path for the Git repository', example: '/path/to/my/repo' })
  @IsOptional()
  @IsString()
  projectRoot?: string;
}

export class RestoreSnapshotDto {
  @ApiProperty({ description: 'Name of the snapshot (Git tag) to restore' })
  @IsString()
  @IsNotEmpty()
  snapshotName: string;

  @ApiPropertyOptional({ description: 'Optional project root path for the Git repository', example: '/path/to/my/repo' })
  @IsOptional()
  @IsString()
  projectRoot?: string;
}

export class ListSnapshotsResponseDto {
  @ApiProperty({ description: 'List of snapshot names (Git tags)' })
  tags: string[];
}

export class DeleteSnapshotDto {
  @ApiProperty({ description: 'Name of the snapshot (Git tag) to delete' })
  @IsString()
  @IsNotEmpty()
  snapshotName: string;

  @ApiPropertyOptional({ description: 'Optional project root path for the Git repository', example: '/path/to/my/repo' })
  @IsOptional()
  @IsString()
  projectRoot?: string;
}
