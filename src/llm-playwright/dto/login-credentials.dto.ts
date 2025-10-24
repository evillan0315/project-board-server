import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

/**
 * DTO for specifying login credentials and selectors for a web page.
 */
export class LoginCredentialsDto {
  @ApiProperty({
    description: 'The username or email for login.',
    example: 'user@example.com',
  })
  @IsString()
  @IsOptional() // Optional if username/password are not used, but selectors are for existing input
  @IsEmail()
  username?: string;

  @ApiProperty({
    description: 'The password for login.',
    example: 'mysecretpassword',
  })
  @IsString()
  @IsOptional() // Optional if username/password are not used, but selectors are for existing input
  password?: string;

  @ApiProperty({
    description: 'CSS selector for the username/email input field.',
    example: '#usernameInput',
  })
  @IsString()
  usernameSelector: string;

  @ApiProperty({
    description: 'CSS selector for the password input field.',
    example: '#passwordInput',
  })
  @IsString()
  passwordSelector: string;

  @ApiProperty({
    description: 'CSS selector for the login submit button.',
    example: '#loginButton',
  })
  @IsString()
  submitSelector: string;
}
