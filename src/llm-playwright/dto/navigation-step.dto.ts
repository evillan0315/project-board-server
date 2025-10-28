import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LoginCredentialsDto } from './login-credentials.dto';

export enum PlaywrightNavigationAction {
  NAVIGATE = 'navigate',
  CLICK = 'click',
  TYPE = 'type',
  LOGIN = 'login',
  WAIT = 'wait',
}

/**
 * DTO for a single navigation step within a Playwright task.
 */
export class NavigationStepDto {
  @ApiProperty({
    description: 'The type of action to perform.',
    enum: PlaywrightNavigationAction,
    example: PlaywrightNavigationAction.CLICK,
  })
  @IsEnum(PlaywrightNavigationAction)
  action: PlaywrightNavigationAction;

  @ApiPropertyOptional({
    description: 'The URL to navigate to. Required if action is NAVIGATE.',
    example: 'https://www.example.com/login',
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({
    description:
      'CSS selector for the element to interact with. Required for CLICK, TYPE actions, or to wait for in WAIT action.',
    example: '#myButton',
  })
  @IsOptional()
  @IsString()
  selector?: string;

  @ApiPropertyOptional({
    description:
      'Value to type into the input field. Required for TYPE action.',
    example: 'Hello World',
  })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({
    description: 'Login credentials and selectors. Required for LOGIN action.',
    type: () => LoginCredentialsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LoginCredentialsDto)
  loginCredentials?: LoginCredentialsDto;

  @ApiPropertyOptional({
    description:
      'Duration in milliseconds to wait. Required if action is WAIT and no selector is provided. Minimum 0.',
    example: 5000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMs?: number;
}
