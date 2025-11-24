import { PartialType } from '@nestjs/swagger';
import { CreateProposedFileChangeDto } from './create-proposed-file-change.dto';

export class UpdateProposedFileChangeDto extends PartialType(
  CreateProposedFileChangeDto,
) {}
