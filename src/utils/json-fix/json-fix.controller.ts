import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiBadRequestResponse,
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
@Controller('api/utils/json')
@UseGuards(JwtAuthGuard)
export class JsonFixController {
  constructor(private readonly service: JsonFixService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Validate JSON (with optional schema)' })
  @ApiBody({
    type: JsonInputDto,
    examples: {
      validJsonNoSchema: {
        summary: 'Example: Valid JSON without schema',
        value: {
          json: '{ "name": "Alice", "age": 30 }',
        } as JsonInputDto,
      },
      validJsonWithSchema: {
        summary: 'Example: Valid JSON with schema',
        value: {
          json: '{ "name": "Bob", "age": 25 }',
          schema:
            '{ "type": "object", "properties": { "name": { "type": "string" }, "age": { "type": "number" } }, "required": ["name", "age"] }',
        } as JsonInputDto,
      },
      invalidJsonAgainstSchema: {
        summary: 'Example: Invalid JSON against schema',
        value: {
          json: '{ "name": "Charlie", "age": "twenty" }', // Age is string, but schema expects number
          schema:
            '{ "type": "object", "properties": { "name": { "type": "string" }, "age": { "type": "number" } }, "required": ["name", "age"] }',
        } as JsonInputDto,
      },
      malformedJsonInput: {
        summary: 'Example: Malformed JSON for validation (will cause parsing error)',
        value: {
          json: '{ "name": "David", "age": 40, }', // Trailing comma
        } as JsonInputDto,
      },
    },
  })
  @ApiOkResponse({
    description: 'JSON is valid (with or without schema).',
    type: JsonOutputDto,
    examples: {
      validWithoutSchema: {
        summary: 'Response: JSON is valid (no schema provided)',
        value: { valid: true } as JsonOutputDto,
      },
      validWithSchema: {
        summary: 'Response: JSON is valid against the provided schema',
        value: { valid: true } as JsonOutputDto,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'JSON is malformed or invalid according to schema.',
    type: JsonOutputDto,
    examples: {
      malformedJson: {
        summary: 'Response: Malformed JSON input causing parsing error',
        value: {
          valid: false,
          errors: ['Unexpected token } in JSON at position 28'],
        } as JsonOutputDto,
      },
      schemaValidationErrors: {
        summary: 'Response: JSON fails schema validation',
        value: {
          valid: false,
          errors: [
            {
              instancePath: '/age',
              schemaPath: '#/properties/age/type',
              keyword: 'type',
              params: { type: 'number' },
              message: 'must be number',
            },
          ],
        } as JsonOutputDto,
      },
    },
  })
  validate(@Body() dto: JsonInputDto): JsonOutputDto {
    const result = this.service.validate(dto.json, dto.schema);
    if (!result.valid) {
      throw new BadRequestException(result.errors);
    }
    return result;
  }

  @Post('repair')
  @ApiOperation({ summary: 'Repair malformed JSON' })
  @ApiBody({
    type: JsonInputDto,
    examples: {
      malformedJsonExample: {
        summary: 'Example: Malformed JSON with trailing comma and unquoted keys',
        value: {
          json: "{ 'name': 'Alice', 'age': 30, }",
        } as JsonInputDto,
      },
      hjsonLikeInputExample: {
        summary: 'Example: Hjson-like input',
        value: {
          json: '{ key: value # This is a comment\n anotherKey: [1, 2, 3] }',
        } as JsonInputDto,
      },
      unrepairableJsonExample: {
        summary: 'Example: Unrepairable JSON input',
        value: {
          json: 'this is not json and cannot be repaired',
        } as JsonInputDto,
      },
    },
  })
  @ApiOkResponse({
    description: 'JSON successfully repaired.',
    type: JsonOutputDto,
    examples: {
      successfulRepairFromMalformed: {
        summary: 'Response: Successfully repaired from malformed JSON',
        value: {
          valid: true,
          repaired: '{\n  "name": "Alice",\n  "age": 30\n}',
        } as JsonOutputDto,
      },
      successfulRepairFromHjson: {
        summary: 'Response: Successfully repaired from Hjson-like input',
        value: {
          valid: true,
          repaired: '{\n  "key": "value",\n  "anotherKey": [\n    1,\n    2,\n    3\n  ]\n}',
        } as JsonOutputDto,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Failed to repair JSON (input is not JSON-like or repair is not possible).',
    type: JsonOutputDto,
    examples: {
      repairFailure: {
        summary: 'Response: Failed to repair JSON',
        value: {
          valid: false,
          errors: ['Hjson.parse: invalid character (L1:C1)'],
        } as JsonOutputDto,
      },
    },
  })
  repair(@Body() dto: JsonInputDto): JsonOutputDto {
    const result = this.service.repair(dto.json);
    if (!result.valid) {
      throw new BadRequestException(result.errors);
    }
    return result;
  }
}
