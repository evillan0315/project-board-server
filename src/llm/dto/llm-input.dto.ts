// src/llm/dto/llm-input.dto.ts

import {
  IsString,
  IsArray,
  ValidateNested,
  IsDefined,
  IsOptional,
} from 'class-validator'; // Import IsOptional
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ScannedFileDto } from '../../file/dto/scan-file.dto'; // Ensure this path is correct

/**
 * Represents the structured input that will be sent to the LLM.
 */
export class LlmInputDto {
  @ApiProperty({
    description: 'The main request or prompt from the user to the AI.',
    example:
      'Implement a new user authentication module with JWT. Include login and register endpoints.',
    required: true,
  })
  @IsString()
  @IsDefined()
  userPrompt: string;

  @ApiProperty({
    description:
      'The absolute path to the root directory of the project being edited.',
    example: '/path/to/your/project',
    required: true,
  })
  @IsString()
  @IsDefined()
  projectRoot: string;

  @ApiProperty({
    description:
      'A high-level overview of the project directory structure, typically generated as a tree string or simplified list.',
    example: `
project-root/
├── src/
│   ├── app.module.ts
│   ├── app.controller.ts
│   └── main.ts
├── package.json
└── tsconfig.json
`,
    required: false,
  })
  @IsString()
  @IsDefined()
  projectStructure: string;

  @ApiProperty({
    description:
      'An array of relevant files from the project, including their paths and content, for the LLM to analyze or modify.',
    type: [ScannedFileDto],
    isArray: true,
    example: [
      {
        filePath: '/path/to/your/project/src/app.module.ts',
        relativePath: 'src/app.module.ts',
        content:
          "import { Module } from '@nestjs/common';\nimport { AppController } from './app.controller';\nimport { AppService } from './app.service';\n\n@Module({\n  imports: [],\n  controllers: [AppController],\n  providers: [AppService],\n})\nexport class AppModule {}\n",
      },
      {
        filePath: '/path/to/your/project/src/app.controller.ts',
        relativePath: 'src/app.controller.ts',
        content:
          "import { Controller, Get } from '@nestjs/common';\nimport { AppService } from './app.service';\n\n@Controller()\nexport class AppController {\n  constructor(private readonly appService: AppService) {}\n\n  @Get()\n  getHello(): string {\n    return this.appService.getHello();\n  }\n}\n",
      },
    ],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScannedFileDto)
  @IsDefined()
  relevantFiles: ScannedFileDto[];

  @ApiProperty({
    description:
      'Additional instructions or constraints for the LLM regarding its behavior, style, or specific requirements.',
    example:
      'Ensure all new code adheres to TypeScript strict mode. Use functional components for React. Avoid external libraries unless specified.',
    required: true,
  })
  @IsString()
  @IsDefined()
  additionalInstructions: string;

  @ApiProperty({
    description:
      'Detailed instructions on the exact JSON format the LLM is expected to return for its response.',
    example: `
{
  "summary": "A brief summary of the proposed changes.",
  "thoughtProcess": "Detailed explanation of the AI's reasoning and steps taken.",
  "changes": [
    {
      "filePath": "path/to/file.ts",
      "action": "add" | "modify" | "delete",
      "newContent": "Optional: New content for 'add'/'modify'",
      "reason": "Optional: Explanation for this specific change"
    }
  ]
}
`,
    required: true,
  })
  @IsString()
  @IsDefined()
  expectedOutputFormat: string;

  @ApiProperty({
    description:
      ' An array of paths (relative to projectRoot) to explicitly scan. If not provided, the AI may decide which files to include based on context.',
    example: ['src/components', 'package.json', 'README.md'],
    type: [String], // Specifies array of strings for Swagger
    isArray: true,
    required: true, // Explicitly false as it's optional
  })
  @IsArray() // Validates it's an array
  @IsString({ each: true }) // Validates each element in the array is a string
  scanPaths: string[];
}
