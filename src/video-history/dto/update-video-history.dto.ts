import { PartialType } from '@nestjs/swagger';
import { CreateVideoHistoryDto } from './create-video-history.dto';

export class UpdateVideoHistoryDto extends PartialType(CreateVideoHistoryDto) {}
