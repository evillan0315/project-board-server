import { PartialType } from '@nestjs/swagger';
import { CreateLlmResponseDto } from './create-llm-response.dto';

export class UpdateLlmResponseDto extends PartialType(CreateLlmResponseDto) {}

