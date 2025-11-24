import { PartialType } from '@nestjs/swagger';
import { CreateFileChangeDto } from './create-file-change.dto';

export class UpdateFileChangeDto extends PartialType(CreateFileChangeDto) {}
