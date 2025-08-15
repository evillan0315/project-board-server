// src/common/services/file-validation.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import type { Express } from 'express';

@Injectable()
export class FileValidationService {
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];
  private readonly allowedExtensions: string[];

  constructor(private readonly configService: ConfigService) {
    // Provide default values if configuration is not found
    this.maxFileSize = this.configService.get<number>(
      'file.maxSize',
      5 * 1024 * 1024,
    ); // Default to 5 MB
    this.allowedMimeTypes = this.configService.get<string[]>(
      'file.allowedMimeTypes',
      ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'], // Sensible defaults
    );
    this.allowedExtensions = this.configService.get<string[]>(
      'file.allowedExtensions',
      ['.jpg', '.jpeg', '.png', '.pdf', '.txt'], // Sensible defaults
    );

    // Optional: Add a check to ensure configuration values are valid if they're not provided via defaults
    this.ensureConfigurationIsValid();
  }

  private ensureConfigurationIsValid(): void {
    if (typeof this.maxFileSize !== 'number' || this.maxFileSize <= 0) {
      throw new Error(
        'File validation configuration error: file.maxSize must be a positive number.',
      );
    }
    if (
      !Array.isArray(this.allowedMimeTypes) ||
      this.allowedMimeTypes.some((type) => typeof type !== 'string')
    ) {
      throw new Error(
        'File validation configuration error: file.allowedMimeTypes must be an array of strings.',
      );
    }
    if (
      !Array.isArray(this.allowedExtensions) ||
      this.allowedExtensions.some(
        (ext) => typeof ext !== 'string' || !ext.startsWith('.'),
      )
    ) {
      throw new Error(
        'File validation configuration error: file.allowedExtensions must be an array of strings starting with a dot.',
      );
    }
  }

  /**
   * Validates a single uploaded file against configured size, MIME type, and extension limits.
   * Throws BadRequestException if validation fails.
   * @param file The Express.Multer.File object to validate.
   */
  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File "${file.originalname}" exceeds size limit (${this.formatBytes(this.maxFileSize)}).`,
      );
    }

    // It's good practice to normalize the MIME type (e.g., remove charset)
    const normalizedMimeType = file.mimetype.split(';')[0].toLowerCase();
    if (!this.allowedMimeTypes.includes(normalizedMimeType)) {
      throw new BadRequestException(
        `Unsupported file type: "${file.mimetype}". Allowed types are: ${this.allowedMimeTypes.join(', ')}.`,
      );
    }

    const ext = extname(file.originalname).toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        `Unsupported file extension: "${ext}". Allowed extensions are: ${this.allowedExtensions.join(', ')}.`,
      );
    }
  }

  /**
   * Validates an array of uploaded files by calling validateFile for each.
   * Throws BadRequestException if validation fails for any file or if no files are provided.
   * @param files An array of Express.Multer.File objects to validate.
   */
  validateMultipleFiles(files: Express.Multer.File[]): void {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded.');
    }

    for (const file of files) {
      this.validateFile(file); // Re-uses the single file validation logic
    }
  }

  /**
   * Helper to format bytes into a human-readable string.
   */
  private formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
