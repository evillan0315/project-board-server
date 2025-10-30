import { PartialType } from '@nestjs/swagger';
import { CreateLlmRequestDto } from './create-llm-request.dto';

export class UpdateLlmRequestDto extends PartialType(CreateLlmRequestDto) {}

