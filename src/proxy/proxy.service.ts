import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
import { URL } from 'url';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly allowedProxyDomains: string[];
  private readonly frontendUrl: string | undefined;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const domains = this.configService.get<string>('ALLOWED_PROXY_DOMAINS');
    this.allowedProxyDomains = domains ? domains.split(',').map(d => d.trim().toLowerCase()) : [];
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL');

    this.logger.log(`Configured ALLOWED_PROXY_DOMAINS: [${this.allowedProxyDomains.join(', ')}]`);
    this.logger.log(`Configured FRONTEND_URL for CORS/CSP: ${this.frontendUrl || 'Not set, defaulting to dynamic origin or *'}`);

    if (this.allowedProxyDomains.length === 0) {
      this.logger.warn('No ALLOWED_PROXY_DOMAINS configured. Proxying to any external domain is a significant security risk (Server-Side Request Forgery - SSRF).');
    }
  }

  /**
   * Checks if the target URL's domain is explicitly allowed by configuration.
   * @param targetUrl The URL to check.
   * @returns True if the domain is allowed or no restrictions are configured, false otherwise.
   */
  private isTargetDomainAllowed(targetUrl: string): boolean {
    if (this.allowedProxyDomains.length === 0) {
      return true; // No restrictions if not configured, but a warning is logged in constructor.
    }

    try {
      const parsedTargetUrl = new URL(targetUrl);
      const targetHostname = parsedTargetUrl.hostname.toLowerCase();
      return this.allowedProxyDomains.some(allowedDomain => {
        // Direct match or subdomain match (e.g., "sub.example.com" matches "example.com")
        return targetHostname === allowedDomain || targetHostname.endsWith(`.${allowedDomain}`);
      });
    } catch (e) {
      this.logger.error(`Failed to parse target URL for domain check: ${targetUrl}. Error: ${(e as Error).message}`);
      return false;
    }
  }

  /**
   * Proxies the given target URL, streams its content, and applies necessary security headers.
   * @param target The URL to proxy.
   * @param req The incoming Express request object.
   * @param res The outgoing Express response object.
   */
  async proxyUrl(target: string, req: Request, res: Response): Promise<void> {
    this.logger.debug(`Incoming proxy request for URL: ${target} from origin: ${req.headers.origin}`);

    if (!target || !/^https?:///i.test(target)) {
      throw new BadRequestException('Invalid or missing target URL format. Must be http(s).');
    }

    if (!this.isTargetDomainAllowed(target)) {
      throw new BadRequestException(`Proxying to target URL domain '${new URL(target).hostname}' is not permitted by server configuration.`);
    }

    try {
      // Filter out sensitive headers from the incoming client request before forwarding to the target.
      // This prevents accidental leakage of client-side auth tokens to third-party services.
      const headersToForward: Record<string, string | string[]> = {};
      const sensitiveHeaders = [
        'cookie',
        'authorization',
        'x-api-key',
        'proxy-authorization',
        'host', // Host header should reflect the proxied target, not the proxy server itself.
        'origin', // Origin header typically updated by Axios for the outgoing request.
        'referer', // Referer might leak info about the proxy or client internal paths.
        'accept-encoding', // Let axios handle encoding for response streaming.
      ];

      for (const key in req.headers) {
        const headerValue = req.headers[key];
        if (req.headers.hasOwnProperty(key) && !sensitiveHeaders.includes(key.toLowerCase()) && headerValue !== undefined) {
          headersToForward[key] = headerValue;
        }
      }
      this.logger.debug(`Forwarding headers: ${JSON.stringify(Object.keys(headersToForward))}`);

      // Perform the actual HTTP GET request to the target URL
      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.get(target, {
          headers: headersToForward,
          responseType: 'stream', // Ensure stream processing
          timeout: 15000, // 15 seconds timeout for upstream request
          maxRedirects: 5, // Follow up to 5 redirects
        }),
      );

      // --- Security Headers Modification for Client Response ---
      // Remove upstream X-Frame-Options and Content-Security-Policy to apply our own.
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');

      // Determine Access-Control-Allow-Origin header
      let corsOrigin: string = '*'; // Default to permissive if no specific frontendUrl is set
      if (this.frontendUrl) {
        corsOrigin = this.frontendUrl; // Prioritize configured frontend URL
      } else if (req.headers.origin) {
        corsOrigin = req.headers.origin;
        this.logger.warn(`FRONTEND_URL not set. Using dynamic Access-Control-Allow-Origin: ${corsOrigin}. For better security, consider setting FRONTEND_URL explicitly.`);
      }
      res.setHeader('Access-Control-Allow-Origin', corsOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');

      // Determine Content-Security-Policy: frame-ancestors directive
      let frameAncestors: string; // Declare local variable
      if (this.frontendUrl) {
        // If FRONTEND_URL is set, restrict embedding to 'self' (the proxy's domain) and the frontend URL.
        // Note: 'self' refers to the origin from which the current document is being served.
        // If the proxy is served from the same domain as the frontend, 'self' would be sufficient.
        // Otherwise, explicitly listing the frontend URL is necessary.
        frameAncestors = `'self' ${this.frontendUrl}`;
      } else {
        frameAncestors = `'*'`; // Default to allow all for embedding if no explicit FRONTEND_URL
        this.logger.warn(`FRONTEND_URL not set. Using permissive CSP 'frame-ancestors *'. Consider setting FRONTEND_URL for tighter security.`);
      }
      res.setHeader('Content-Security-Policy', `frame-ancestors ${frameAncestors}`);

      // Forward Content-Type from the original response, default to binary stream
      res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');

      // Forward other relevant headers from the proxied response (e.g., Cache-Control, ETag, Last-Modified)
      // Exclude transfer-encoding as it might conflict with Node.js streaming and is often managed automatically.
      const headersToCopy = ['cache-control', 'expires', 'last-modified', 'etag', 'content-length'];
      headersToCopy.forEach(header => {
        if (response.headers[header]) {
          res.setHeader(header, response.headers[header]);
        }
      });

      // Pipe the upstream response stream directly to the client's response
      response.data.pipe(res);
      this.logger.debug(`Successfully streamed content from: ${target}`);

    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error(`Axios HTTP error during proxy for ${target}: ${error.message}`, error.stack);
        // If the upstream server responded with an error, forward its status and data.
        if (error.response) {
          res.status(error.response.status).send(error.response.data);
          return;
        } else if (error.code === 'ECONNABORTED') {
          // Timeout error
          throw new InternalServerErrorException(`Proxy request to ${target} timed out after 15 seconds.`);
        } else {
          // Other network errors (DNS, connection refused, etc.)
          throw new InternalServerErrorException(`Network error while trying to reach ${target}: ${error.message}`);
        }
      } else {
        this.logger.error(`Unexpected server error during proxy for ${target}: ${(error as Error).message}`, (error as Error).stack);
        throw new InternalServerErrorException(`An unexpected server error occurred while processing the proxy request for ${target}.`);
      }
    }
  }
}
