import { PartialType } from '@nestjs/swagger';
import { CreateSchemaSubmissionDto } from './create-schema-submission.dto';

export class UpdateSchemaSubmissionDto extends PartialType(
  CreateSchemaSubmissionDto,
) {}
