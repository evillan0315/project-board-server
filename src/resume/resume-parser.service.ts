// src/resume/resume-parser.service.ts

import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { Express } from 'express'; // Required for Express.Multer.File type

@Injectable()
export class ResumeParserService {
  private readonly logger = new Logger(ResumeParserService.name);

  /**
   * Extracts text content from a PDF or DOCX file.
   *
   * @param file The file object provided by Multer (Express.Multer.File).
   * @returns A Promise that resolves to the extracted text content of the resume.
   * @throws BadRequestException if no file is provided or the file type is unsupported.
   * @throws InternalServerErrorException if an error occurs during the parsing process.
   */
  async extractTextFromFile(file: Express.Multer.File): Promise<string> {
    if (!file) {
      this.logger.error('No file provided for text extraction.');
      throw new BadRequestException('No file provided for text extraction.');
    }
    console.log(file, 'file');
    const { mimetype, buffer, originalname } = file;
    this.logger.log(
      `Attempting to extract text from file: ${originalname} (MIME: ${mimetype})`,
    );

    try {
      if (mimetype === 'application/pdf') {
        return await this.extractTextFromPdf(buffer);
      } else if (
        mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
        // Add 'application/msword' for .doc if you expect it, but Mammoth is primarily for DOCX
        // and .doc parsing can be more complex/less reliable without external tools.
      ) {
        return await this.extractTextFromDocx(buffer);
      } else {
        this.logger.warn(
          `Unsupported file type for text extraction: ${mimetype}`,
        );
        throw new BadRequestException(
          `Unsupported file type: "${mimetype}". Only PDF and DOCX files are currently supported.`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error during text extraction from ${originalname}: ${error.message}`,
        error.stack, // Ensure original stack is logged
      );
      // Re-throw BadRequestException or InternalServerErrorException if it originated from specific file validation/parsing,
      // to preserve its more specific message.
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      // Catch-all for any other unexpected parsing errors that weren't specifically handled below
      throw new InternalServerErrorException(
        `Failed to extract text from file "${originalname}". An unexpected parsing error occurred.`,
      );
    }
  }

  /**
   * Extracts text from a PDF file buffer using `pdf-parse`.
   * @param buffer The Buffer containing the PDF file's binary data.
   * @returns A Promise resolving to the extracted plain text.
   */
  private async extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      this.logger.error(
        `Failed to parse PDF buffer: ${error.message}`,
        error.stack,
      ); // Log full error details

      let clientErrorMessage = 'Failed to parse PDF file content.';
      if (error instanceof Error) {
        if (error.message.includes('Password protected file')) {
          clientErrorMessage =
            'The PDF file is password protected and cannot be processed.';
        } else if (
          error.message.includes('Invalid PDF file') ||
          error.message.includes('PDFJS_ERROR')
        ) {
          clientErrorMessage = 'The PDF file is invalid or corrupted.';
        } else {
          clientErrorMessage += ' It might be corrupted or malformed.';
        }
      }
      // Throw InternalServerErrorException with a more specific client-facing message
      throw new InternalServerErrorException(clientErrorMessage);
    }
  }

  /**
   * Extracts text from a DOCX file buffer using `mammoth.js`.
   * `mammoth.extractRawText` is suitable for getting plain text.
   * @param buffer The Buffer containing the DOCX file's binary data.
   * @returns A Promise resolving to the extracted plain text.
   */
  private async extractTextFromDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer: buffer });
      // mammoth.extractRawText returns an object with a 'value' property containing the raw text.
      return result.value;
    } catch (error) {
      this.logger.error(
        `Failed to parse DOCX buffer: ${error.message}`,
        error.stack,
      ); // Log full error details
      // Mammoth can throw specific errors for invalid DOCX structures
      if (error instanceof Error && error.message.includes('Invalid docx')) {
        throw new BadRequestException(
          'Invalid DOCX file format. The file might be corrupted.',
        );
      }
      throw new InternalServerErrorException(
        'Failed to parse DOCX file content. It might be corrupted or malformed.',
      );
    }
  }
}
