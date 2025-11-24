import { PartialType } from '@nestjs/swagger';
import { CreateDiffDto } from './create-diff.dto';

export class UpdateDiffDto extends PartialType(CreateDiffDto) {}
