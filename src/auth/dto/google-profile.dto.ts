// src/auth/dto/google-profile.dto.ts
import {
  IsArray,
  IsOptional,
  IsString,
  IsEmail,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class GoogleNameDto {
  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  familyName?: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  givenName?: string;
}

class GoogleEmailDto {
  @ApiProperty({ example: 'john.doe@gmail.com' })
  @IsEmail()
  value: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  verified?: boolean;
}

class GooglePhotoDto {
  @ApiProperty({ example: 'https://lh3.googleusercontent.com/a-/photo.jpg' })
  @IsUrl()
  value: string;
}

export class GoogleProfileDto {
  @ApiProperty({ example: '112233445566778899001' })
  @IsString()
  id: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ type: GoogleNameDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GoogleNameDto)
  name?: GoogleNameDto;

  @ApiPropertyOptional({ type: [GoogleEmailDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoogleEmailDto)
  emails?: GoogleEmailDto[];

  @ApiPropertyOptional({ type: [GooglePhotoDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GooglePhotoDto)
  photos?: GooglePhotoDto[];

  @ApiPropertyOptional({ example: 'google' })
  @IsOptional()
  @IsString()
  provider?: string;
}
