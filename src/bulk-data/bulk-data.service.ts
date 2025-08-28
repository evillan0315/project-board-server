import { Injectable, BadRequestException } from '@nestjs/common';
import * as Papa from 'papaparse'; // Import papaparse
import { ImportBulkDataDto, ImportFormat } from './dto/import-bulk-data.dto';
import { ExportBulkDataDto, ExportFormat } from './dto/export-bulk-data.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BulkDataService {
  // IMPORTANT: Replace 'user' with your actual Prisma model name throughout this file.
  // This will be used to dynamically access the Prisma client's model property (e.g., prisma.user).
  private readonly modelName = 'user'; // Example model name

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Parses a CSV string into an array of objects using papaparse.
   * @param csvString The CSV data as a string.
   * @returns An array of objects representing the CSV rows.
   */
  private _parseCsv(csvString: string): Record<string, any>[] {
    const parseResult = Papa.parse(csvString, {
      header: true,            // Treat the first row as headers and return an array of objects
      skipEmptyLines: true,    // Skip any blank lines
      dynamicTyping: true,     // Automatically convert numeric and boolean values
      transformHeader: (header) => header.trim(), // Trim whitespace from headers
    });

    if (parseResult.errors.length > 0) {
      // Aggregate papaparse errors for a more informative message
      const errorMessages = parseResult.errors.map(err => `${err.code}: ${err.message} (Row: ${err.row})`).join('; ');
      throw new BadRequestException(`CSV parsing errors: ${errorMessages}`);
    }

    if (!Array.isArray(parseResult.data) || parseResult.data.length === 0) {
      throw new BadRequestException('CSV data must contain at least headers and one record.');
    }

    return parseResult.data as Record<string, any>[];
  }

  /**
   * Converts an array of objects into a CSV string using papaparse.
   * @param records The array of objects to convert.
   * @returns A CSV string.
   */
  private _toCsv(records: Record<string, any>[]): string {
    if (records.length === 0) {
      // If there are no records, we can return an empty string or just the headers.
      // For now, let's return an empty string to signify no data.
      return '';
    }

    // papaparse automatically handles headers and escaping
    const unparseResult = Papa.unparse(records, {
      header: true, // Include headers in the output
      quotes: true, // Always quote fields to be safe (optional, but good for consistency)
    });

    return unparseResult;
  }

  // Removed _escapeCsvValue as papaparse handles this internally.

  async importData(dto: ImportBulkDataDto): Promise<{ message: string }> {
    let records: Record<string, any>[] = [];
    let importCount = 0;

    switch (dto.format) {
      case ImportFormat.JSON:
        try {
          records = JSON.parse(dto.data ?? '');
          if (!Array.isArray(records)) {
            throw new BadRequestException('JSON data must be an array of records');
          }
        } catch (error) {
          throw new BadRequestException(`Invalid JSON data: ${error.message}`);
        }
        break;

      case ImportFormat.CSV:
        try {
          // Use papaparse for CSV parsing
          records = this._parseCsv(dto.data ?? '') ;
          // _parseCsv already includes checks for empty data/errors, but a final check doesn't hurt.
          if (records.length === 0) {
            throw new BadRequestException('No valid records found in CSV data after parsing.');
          }
        } catch (error) {
          throw new BadRequestException(`CSV import error: ${error.message}`);
        }
        break;

      case ImportFormat.SQL:
        try {
          // --- Prisma Implementation for SQL Import ---
          // Executes raw SQL. Use with caution to prevent SQL injection if data comes from untrusted sources.
          await this.prisma.$executeRawUnsafe(dto.data ?? '');
          return { message: 'SQL script executed successfully' };
        } catch (error) {
          throw new BadRequestException(`SQL execution error: ${error.message}`);
        }

      default:
        throw new BadRequestException('Unsupported format');
    }

    // --- Prisma Implementation for JSON/CSV Import ---
    // Ensure the 'records' array contains objects that match your Prisma model's schema.
    try {
      // Access the Prisma model dynamically using the string modelName
      const model = (this.prisma as any)[this.modelName];
      if (!model || typeof model.create !== 'function') {
        throw new Error(`Prisma model '${this.modelName}' not found or does not support 'create' operation.`);
      }

      // Use Prisma's transaction for atomicity
      const createdRecords = await this.prisma.$transaction(
        records.map((record) => model.create({ data: record }))
      );
      importCount = createdRecords.length;
    } catch (error) {
      // Catch specific Prisma errors for better feedback if desired
      if (error.code) { // Prisma error codes
        if (error.code === 'P2002') { // Example: Unique constraint violation
          throw new BadRequestException(`Database error (P2002 - Unique Constraint): A record with a duplicate unique field already exists. ${error.message}`);
        }
        // Add more specific error handling for other Prisma codes if needed
        throw new BadRequestException(`Database error (${error.code}): ${error.message}`);
      }
      throw new BadRequestException(`Database import error: ${error.message}`);
    }

    return { message: `${importCount} ${dto.format.toUpperCase()} records imported successfully` };
  }

  async exportData(dto: ExportBulkDataDto): Promise<{ data: string }> {
    // Access the Prisma model dynamically using the string modelName
    const model = (this.prisma as any)[this.modelName];
    if (!model || typeof model.findMany !== 'function') {
      throw new Error(`Prisma model '${this.modelName}' not found or does not support 'findMany' operation.`);
    }
    const records = await model.findMany(); // Using the dynamic model access

    if (dto.format === ExportFormat.JSON) {
      return { data: JSON.stringify(records, null, 2) };
    } else if (dto.format === ExportFormat.SQL) {
      const sqlStatements = records.map((record: any) => {
        const columns = Object.keys(record)
          .filter(key => record[key] !== undefined && record[key] !== null)
          .map((key) => `\`${key}\``)
          .join(', ');

        const values = Object.keys(record)
          .filter(key => record[key] !== undefined && record[key] !== null)
          .map((key) => {
            const value = record[key];
            if (typeof value === 'string') {
              return `'${value.replace(/'/g, "''")}'`;
            }
            if (typeof value === 'boolean') {
              return value ? 'TRUE' : 'FALSE';
            }
            if (value instanceof Date) {
              return `'${value.toISOString()}'`; // Ensures ISO format for database
            }
            return value;
          })
          .join(', ');

        // IMPORTANT: Replace 'users' with your actual database table name.
        return `INSERT INTO \`users\` (${columns}) VALUES (${values});`;
      });
      return { data: sqlStatements.join('\n') };
    } else if (dto.format === ExportFormat.CSV) {
      // Use papaparse for CSV unparsing
      return { data: this._toCsv(records) };
    } else {
      throw new BadRequestException('Unsupported format');
    }
  }
}
