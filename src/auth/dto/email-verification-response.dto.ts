// src/auth/dto/email-verification-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class EmailVerificationResponseDto {
  @ApiProperty({ example: 'Email verified successfully.' })
  message: string;
}
