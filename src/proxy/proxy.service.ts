import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { Response } from 'express';
import { Readable } from 'stream';

@Injectable()
export class ProxyService {
  /**
   * Proxies the given target URL and streams it back to the client.
   * Adds headers to allow iframe embedding.
   */
  async proxyUrl(target: string, res: Response): Promise<void> {
    if (!target || !/^https?:\/\//i.test(target)) {
      throw new BadRequestException('Invalid or missing target URL');
    }

    try {
      const response: AxiosResponse<Readable> = await axios.get(target, {
        responseType: 'stream',
      });

      // Remove any security headers from the upstream that would block iframe embedding
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');

      // Set our own headers to allow embedding
      res.setHeader('X-Frame-Options', 'ALLOWALL');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', response.headers['content-type'] || 'text/html');

      // Pipe the upstream response directly to the client
      response.data.pipe(res);
    } catch (error) {
      throw new InternalServerErrorException(`Failed to fetch target URL: ${error.message}`);
    }
  }
}

