import { IsArray, IsDefined, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProposedFileChangeDto } from 'src/llm/dto'; // Assuming this path is correct

export class ApplyChangesDto {
  @ApiProperty({
    description: 'Array of proposed file changes to apply.',
    type: [ProposedFileChangeDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProposedFileChangeDto)
  @IsDefined()
  changes: ProposedFileChangeDto[];

  @ApiProperty({
    description: 'The absolute path to the project root directory where changes should be applied.',
    example: '/path/to/your/project',
  })
  @IsString()
  @IsDefined()
  projectRoot: string;
}
