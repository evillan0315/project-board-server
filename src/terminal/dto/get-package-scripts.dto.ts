import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetPackageScriptsDto {
  @ApiProperty({
    description: 'The root directory of the project where package.json is located',
    example: '/path/to/my-project',
  })
  @IsString()
  projectRoot: string;
}
