import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiExtraModels,
  ApiProperty, // ApiProperty for ImportFileDto, still needed
  // getModelSchemaRef, // <-- REMOVED THIS IMPORT!
  // ApiOkResponse, // Removed, as it was not used directly
} from '@nestjs/swagger';

import { BulkDataService } from './bulk-data.service';
import { ImportBulkDataDto, ImportFormat } from './dto/import-bulk-data.dto';
import { ExportBulkDataDto, ExportFormat } from './dto/export-bulk-data.dto';

// Define a common DTO for file upload combined with format
class ImportFileDto {
  @ApiProperty({
    enum: ImportFormat,
    example: ImportFormat.CSV,
    description: 'The format of the data in the uploaded file.',
  })
  format: ImportFormat;

  @ApiProperty({ type: 'string', format: 'binary', description: 'The file containing the bulk data.' })
  file: any;
}

@ApiTags('Bulk Data Operations')
@Controller('bulk-data')
// ApiExtraModels is still useful for Swagger to list these DTOs in "Schemas" section,
// even if we define their structure inline in this specific @ApiBody.
@ApiExtraModels(ImportBulkDataDto, ImportFileDto)
export class BulkDataController {
  constructor(private readonly bulkDataService: BulkDataService) {}

  @Post('import')
  @ApiOperation({
    summary: 'Import bulk data',
    description: 'Imports data from JSON, SQL, or CSV format. Can receive data either directly in the request body or as an uploaded file.',
  })
  @ApiConsumes('multipart/form-data', 'application/json', 'text/plain') // Allow file upload, JSON, or plain text
  @ApiBody({
    description: 'Data to import. If uploading a file, specify format as a form field. If providing data in body, use application/json or text/plain.',
    examples: {
      jsonBody: {
        summary: 'Import JSON data via Request Body',
        description: 'Set Content-Type: application/json. Format is inferred from the DTO structure.',
        value: {
          format: ImportFormat.JSON,
          data: JSON.stringify([
            { name: 'Example User 1', email: 'user1@example.com', age: 22 },
            { name: 'Example User 2', email: 'user2@example.com', age: 34 },
          ], null, 2),
        } satisfies ImportBulkDataDto,
      },
      csvFile: {
        summary: 'Import CSV data via File Upload',
        description: 'Set Content-Type: multipart/form-data. File field name must be `file`.',
        value: {
          format: ImportFormat.CSV,
          file: 'CSV content here', // This hints at the file content in the example.
        } satisfies ImportFileDto as any,
      },
    },
    // Manual inline schema definition since getModelSchemaRef is removed
    schema: {
      oneOf: [
        // Option 1: ImportBulkDataDto structure for application/json or text/plain
        {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              enum: Object.values(ImportFormat), // Use enum values for Swagger
              example: ImportFormat.JSON,
              description: 'The format of the data to be imported (JSON, SQL, or CSV string).',
            },
            data: {
              type: 'string',
              description: 'The data string to be imported. Required if no file is uploaded.',
            },
          },
          required: ['format'],
        },
        // Option 2: Multipart/form-data structure (represented conceptually by ImportFileDto)
        {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              enum: Object.values(ImportFormat), // Use enum values for Swagger
              example: ImportFormat.CSV,
              description: 'The format of the data in the uploaded file.',
            },
            file: { type: 'string', format: 'binary', description: 'The file containing the bulk data.' },
          },
          required: ['format', 'file'],
        },
      ],
    },
  })
  @ApiResponse({ status: 201, description: 'Bulk data imported successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid data or unsupported format.' })
  @UseInterceptors(FileInterceptor('file')) // 'file' is the name of the field in the form data
  async import(
    @Body() importDto: ImportBulkDataDto, // Body can contain format and data string
    @UploadedFile() file?: Express.Multer.File, // Or file can be uploaded
  ): Promise<{ message: string }> {
    if (!importDto.format) {
      throw new BadRequestException('Format is required.');
    }

    let dataToImport = importDto.data;

    // If a file is uploaded, prioritize its content
    if (file) {
      if (file.size === 0) {
        throw new BadRequestException('Uploaded file is empty.');
      }
      dataToImport = file.buffer.toString('utf8'); // Assuming UTF-8 encoding
    }

    if (!dataToImport) {
      throw new BadRequestException('No data provided for import. Provide data in the body or upload a file.');
    }

    return this.bulkDataService.importData({
      format: importDto.format,
      data: dataToImport,
    });
  }

  @Get('export')
  @ApiOperation({
    summary: 'Export bulk data',
    description: 'Exports all data for the configured model (e.g., User) in the specified format.',
  })
  @ApiQuery({ name: 'format', enum: ExportFormat, example: ExportFormat.JSON, description: 'The desired export format.' })
  @ApiResponse({
    status: 200,
    description: 'Bulk data exported successfully.',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'John Doe' },
              email: { type: 'string', example: 'john.doe@example.com' },
              age: { type: 'number', example: 30 },
            },
          },
        },
      },
      'text/plain': {
        schema: { type: 'string', example: "INSERT INTO `users` (`id`, `name`, `email`, `age`) VALUES (1, 'John Doe', 'john.doe@example.com', 30);" },
      },
      'text/csv': {
        schema: { type: 'string', example: "id,name,email,age\n1,John Doe,john.doe@example.com,30" },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Unsupported format.' })
  async export(
    @Query() dto: ExportBulkDataDto,
    @Res() res: Response,
  ): Promise<any> {
    const { data } = await this.bulkDataService.exportData(dto);

    let contentType: string;
    let filename: string;

    switch (dto.format) {
      case ExportFormat.JSON:
        contentType = 'application/json';
        filename = 'export.json';
        break;
      case ExportFormat.SQL:
        contentType = 'text/plain'; // Or application/sql if you have it
        filename = 'export.sql';
        break;
      case ExportFormat.CSV:
        contentType = 'text/csv';
        filename = 'export.csv';
        break;
      default:
        throw new BadRequestException('Unsupported format');
    }

    res.header('Content-Type', contentType);
    res.attachment(filename); // Suggests filename for download
    res.status(HttpStatus.OK).send(data);
  }
}
