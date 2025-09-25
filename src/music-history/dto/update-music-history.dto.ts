import { PartialType } from '@nestjs/swagger';
import { CreateMusicHistoryDto } from './create-music-history.dto';

export class UpdateMusicHistoryDto extends PartialType(CreateMusicHistoryDto) {}
