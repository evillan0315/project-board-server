import { IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for validating the URL query parameter in proxy requests.
 */
export class ProxyUrlDto {
  @ApiProperty({
    description: 'The URL to proxy',
    example: 'https://example.com/image.png',
  })
  @IsNotEmpty({
    message: 'URL to proxy cannot be empty.',
  })
  @IsUrl(
    {},
    { message: 'URL must be a valid URL address (e.g., http://example.com).' },
  )
  url: string;
}
