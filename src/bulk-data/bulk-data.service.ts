/**
 * FilePath: src/modules/bulk-data/bulk-data.service.ts
 * Title: Bulk Data Import and Export Service
 * Reason: Handles parsing, validation, and transformation of CSV, JSON, and SQL data for import/export operations via Prisma.
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import * as Papa from 'papaparse';
import { ImportBulkDataDto, ImportFormat } from './dto/import-bulk-data.dto';
import { ExportBulkDataDto, ExportFormat } from './dto/export-bulk-data.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BulkDataService {
  constructor(private readonly prisma: PrismaService) {}

  private _parseCsv(csvString: string): Record<string, any>[] {
    const parseResult = Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      const errorMessages = parseResult.errors
        .map((err) => `${err.code}: ${err.message} (Row: ${err.row})`)
        .join('; ');
      throw new BadRequestException(`CSV parsing errors: ${errorMessages}`);
    }

    if (!Array.isArray(parseResult.data) || parseResult.data.length === 0) {
      throw new BadRequestException(
        'CSV data must contain at least headers and one record.',
      );
    }

    return parseResult.data as Record<string, any>[];
  }

  private _toCsv(records: Record<string, any>[]): string {
    if (records.length === 0) return '';
    return Papa.unparse(records, { header: true, quotes: true });
  }

  private _getPrismaModel(modelName: string): any {
    const model = (this.prisma as any)[modelName.toLowerCase()];
    if (!model || typeof model.create !== 'function') {
      throw new BadRequestException(
        `Prisma model '${modelName}' not found or does not support CRUD operations.`,
      );
    }
    return model;
  }

  async importData(dto: ImportBulkDataDto): Promise<{ message: string }> {
    let records: Record<string, any>[] = [];
    const model = this._getPrismaModel(dto.modelName);

    switch (dto.format) {
      case ImportFormat.JSON:
        try {
          records = JSON.parse(dto.data ?? '');
          if (!Array.isArray(records)) {
            throw new BadRequestException('JSON data must be an array.');
          }
        } catch (error) {
          throw new BadRequestException(`Invalid JSON: ${error.message}`);
        }
        break;

      case ImportFormat.CSV:
        records = this._parseCsv(dto.data ?? '');
        break;

      case ImportFormat.SQL:
        try {
          await this.prisma.$executeRawUnsafe(dto.data ?? '');
          return { message: 'SQL script executed successfully.' };
        } catch (error) {
          throw new BadRequestException(`SQL execution error: ${error.message}`);
        }

      default:
        throw new BadRequestException('Unsupported import format.');
    }

    try {
      const createdRecords = await this.prisma.$transaction(
        records.map((record) => model.create({ data: record })),
      );
      return {
        message: `${createdRecords.length} ${dto.format.toUpperCase()} records imported successfully.`,
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          `Unique constraint violation: ${error.message}`,
        );
      }
      throw new BadRequestException(`Database error: ${error.message}`);
    }
  }

  async exportData(dto: ExportBulkDataDto): Promise<{ data: string }> {
    const model = this._getPrismaModel(dto.modelName);
    const records = await model.findMany();

    switch (dto.format) {
      case ExportFormat.JSON:
        return { data: JSON.stringify(records, null, 2) };

      case ExportFormat.CSV:
        return { data: this._toCsv(records) };

      case ExportFormat.SQL:
        const sqlStatements = records.map((record: any) => {
          const keys = Object.keys(record).filter(
            (k) => record[k] !== undefined && record[k] !== null,
          );

          const columns = keys.map((k) => `\`${k}\``).join(', ');
          const values = keys
            .map((k) => {
              const value = record[k];
              if (typeof value === 'string')
                return `'${value.replace(/'/g, "''")}'`;
              if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
              if (value instanceof Date)
                return `'${value.toISOString()}'`;
              return value;
            })
            .join(', ');

          return `INSERT INTO \`${dto.modelName.toLowerCase()}\` (${columns}) VALUES (${values});`;
        });

        return { data: sqlStatements.join('\n') };

      default:
        throw new BadRequestException('Unsupported export format.');
    }
  }
}
