import { PartialType } from '@nestjs/swagger';
import { CreateSystemInstructionDto } from './create-system-instruction.dto';

export class UpdateSystemInstructionDto extends PartialType(
  CreateSystemInstructionDto,
) {}
