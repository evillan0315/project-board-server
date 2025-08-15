import { ApiProperty } from '@nestjs/swagger';

export class RemoteFileEntryDto {
  @ApiProperty({ description: 'Relative path of the file' })
  path: string;

  @ApiProperty({ description: 'Size of the file in bytes' })
  size: number;

  @ApiProperty({
    description: 'Last modified time of the file',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  modifiedTime: Date | null;
}

export class RemoteDirectoryEntryDto {
  @ApiProperty({ description: 'Relative path of the directory' })
  path: string;
}

export class RemoteFileListDto {
  @ApiProperty({
    type: [RemoteFileEntryDto],
    description: 'List of files with metadata',
  })
  files: RemoteFileEntryDto[];

  @ApiProperty({
    type: [RemoteDirectoryEntryDto],
    description: 'List of directories',
  })
  directories: RemoteDirectoryEntryDto[];
}
