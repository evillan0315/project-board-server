import { PartialType } from '@nestjs/swagger';
import { CreatePlaylistMediaFileDto } from './create-playlist-media-file.dto';

export class UpdatePlaylistMediaFileDto extends PartialType(
  CreatePlaylistMediaFileDto,
) {}
