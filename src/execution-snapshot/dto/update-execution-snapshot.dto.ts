import { PartialType } from '@nestjs/swagger';
import { CreateExecutionSnapshotDto } from './create-execution-snapshot.dto';

export class UpdateExecutionSnapshotDto extends PartialType(
  CreateExecutionSnapshotDto,
) {}
