import { PartialType } from '@nestjs/swagger';
import { CreateGeminiResponseDto } from './create-gemini-response.dto';

export class UpdateGeminiResponseDto extends PartialType(
  CreateGeminiResponseDto,
) {}
