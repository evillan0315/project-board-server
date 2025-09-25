import { PartialType } from '@nestjs/swagger';
import { CreateFavoriteVideoDto } from './create-favorite-video.dto';

export class UpdateFavoriteVideoDto extends PartialType(
  CreateFavoriteVideoDto,
) {}
