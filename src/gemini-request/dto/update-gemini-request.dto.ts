import { PartialType } from '@nestjs/swagger';
import { CreateGeminiRequestDto } from './create-gemini-request.dto';

export class UpdateGeminiRequestDto extends PartialType(
  CreateGeminiRequestDto,
) {}
