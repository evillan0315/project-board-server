import { PartialType } from '@nestjs/swagger';
import { CreateCommandHistoryDto } from './create-command-history.dto';

export class UpdateCommandHistoryDto extends PartialType(
  CreateCommandHistoryDto,
) {}
