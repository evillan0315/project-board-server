import {
  Body,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { JsonYamlService } from './json-yaml.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JsonToYamlDto } from './dto/json-to-yaml.dto';
import { YamlToJsonDto } from './dto/yaml-to-json.dto';
import { JsonToYamlResponseDto } from './dto/json-to-yaml-response.dto';
import { YamlToJsonResponseDto } from './dto/yaml-to-json-response.dto';
import {
  ApiBody,
  ApiConsumes,
  ApiTags,
  ApiQuery,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Utilities')
@Controller('api/utils/json-yaml')
export class JsonYamlController {
  constructor(private readonly jsonYamlService: JsonYamlService) {}

  @Post('to-yaml')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Convert JSON to YAML',
    description:
      'Converts a JSON object to YAML format. Optionally saves the result to a file if `save=true` is provided.',
  })
  @ApiBody({ type: JsonToYamlDto })
  @ApiQuery({
    name: 'save',
    required: false,
    type: Boolean,
    description: 'Whether to save the result to a file',
  })
  @ApiResponse({
    status: 200,
    description: 'Converted YAML output',
    type: JsonToYamlResponseDto,
  })
  convertJsonToYaml(
    @Body() body: JsonToYamlDto,
    @Query('save') save?: string,
  ): JsonToYamlResponseDto {
    const yaml = this.jsonYamlService.jsonToYaml(body.json);
    let filePath: string | undefined;
    if (save === 'true') {
      filePath = this.jsonYamlService.saveResult(
        yaml,
        body.filename || 'output.yaml',
      );
    }
    return { yaml, filePath };
  }

  @Post('to-json')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Convert YAML to JSON',
    description:
      'Converts a YAML string to JSON format. Optionally saves the result to a file if `save=true` is provided.',
  })
  @ApiBody({ type: YamlToJsonDto })
  @ApiQuery({
    name: 'save',
    required: false,
    type: Boolean,
    description: 'Whether to save the result to a file',
  })
  @ApiResponse({
    status: 200,
    description: 'Converted JSON output',
    type: YamlToJsonResponseDto,
  })
  convertYamlToJson(
    @Body() body: YamlToJsonDto,
    @Query('save') save?: string,
  ): YamlToJsonResponseDto {
    const json = this.jsonYamlService.yamlToJson(body.yaml);
    let filePath: string | undefined;
    if (save === 'true') {
      filePath = this.jsonYamlService.saveResult(
        JSON.stringify(json, null, 2),
        body.filename || 'output.json',
      );
    }
    return { json, filePath };
  }

  @Post('upload-json')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload JSON file and convert to YAML',
    description:
      'Accepts a JSON file upload, converts its content to YAML, and optionally saves the output file.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'filename',
    required: false,
    description: 'Custom YAML filename (with .yaml)',
  })
  @ApiQuery({
    name: 'save',
    required: false,
    type: Boolean,
    description: 'Whether to save the result to a file',
  })
  @ApiResponse({
    status: 200,
    description: 'Converted YAML output from uploaded JSON file',
    type: JsonToYamlResponseDto,
  })
  uploadJson(
    @UploadedFile() file: Express.Multer.File,
    @Query('save') save?: string,
    @Query('filename') filename?: string,
  ): JsonToYamlResponseDto {
    const jsonContent = JSON.parse(file.buffer.toString('utf8'));
    const yaml = this.jsonYamlService.jsonToYaml(jsonContent);
    let filePath: string | undefined;
    if (save === 'true') {
      filePath = this.jsonYamlService.saveResult(
        yaml,
        filename || 'uploaded-output.yaml',
      );
    }
    return { yaml, filePath };
  }

  @Post('upload-yaml')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload YAML file and convert to JSON',
    description:
      'Accepts a YAML file upload, converts its content to JSON, and optionally saves the output file.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'filename',
    required: false,
    description: 'Custom JSON filename (with .json)',
  })
  @ApiQuery({
    name: 'save',
    required: false,
    type: Boolean,
    description: 'Whether to save the result to a file',
  })
  @ApiResponse({
    status: 200,
    description: 'Converted JSON output from uploaded YAML file',
    type: YamlToJsonResponseDto,
  })
  uploadYaml(
    @UploadedFile() file: Express.Multer.File,
    @Query('save') save?: string,
    @Query('filename') filename?: string,
  ): YamlToJsonResponseDto {
    const yamlStr = file.buffer.toString('utf8');
    const json = this.jsonYamlService.yamlToJson(yamlStr);
    let filePath: string | undefined;
    if (save === 'true') {
      filePath = this.jsonYamlService.saveResult(
        JSON.stringify(json, null, 2),
        filename || 'uploaded-output.json',
      );
    }
    return { json, filePath };
  }
}
