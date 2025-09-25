import { PartialType } from '@nestjs/swagger';
import { CreateFavoriteSongDto } from './create-favorite-song.dto';

export class UpdateFavoriteSongDto extends PartialType(CreateFavoriteSongDto) {}
