import {
  Controller,
  Post,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import { JsonFixService } from './json-fix.service';
import { JsonInputDto } from './dto/json-input.dto';
import { JsonOutputDto } from './dto/json-output.dto';

import { JwtAuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';

@ApiTags('Utilities')
@ApiBearerAuth()
@ApiExtraModels(JsonOutputDto)
@Controller('api/utils/json')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JsonFixController {
  constructor(private readonly service: JsonFixService) {}

  @Post('validate')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Validate JSON (with optional schema)' })
  @ApiBody({ type: JsonInputDto })
  @ApiOkResponse({
    description: 'JSON is valid (with or without schema).',
    type: JsonOutputDto,
    examples: {
      valid: {
        summary: 'Valid JSON',
        value: {
          valid: true,
        } as JsonOutputDto,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'JSON is malformed or invalid according to schema.',
    type: JsonOutputDto,
    examples: {
      invalid: {
        summary: 'Malformed JSON',
        value: {
          valid: false,
          errors: ['Unexpected token at position 10'],
        } as JsonOutputDto,
      },
    },
  })
  validate(@Body() dto: JsonInputDto): JsonOutputDto {
    const result = this.service.validate(dto.json, dto.schema);
    if (!result.valid) {
      throw new BadRequestException({
        valid: false,
        errors: result.errors,
      } as JsonOutputDto);
    }
    return result;
  }

  @Post('repair')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Attempt to repair invalid JSON' })
  @ApiBody({
    description: 'JSON string to repair',
    schema: {
      type: 'object',
      properties: {
        json: {
          type: 'string',
          example: '{ foo: "bar", }',
        },
      },
      required: ['json'],
    },
  })
  @ApiOkResponse({
    description: 'JSON was successfully repaired.',
    type: JsonOutputDto,
    examples: {
      repaired: {
        summary: 'Successfully repaired JSON',
        value: {
          valid: true,
          repairedJson: '{"foo":"bar"}',
        } as JsonOutputDto,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Repair attempt failed (unrecoverable JSON).',
    type: JsonOutputDto,
    examples: {
      unrecoverable: {
        summary: 'Unrepairable JSON',
        value: {
          valid: false,
          errors: ['Unexpected end of JSON input'],
        } as JsonOutputDto,
      },
    },
  })
  async repair(@Body('json') json: string): Promise<JsonOutputDto> {
    return this.service.repair(json);
  }
}
