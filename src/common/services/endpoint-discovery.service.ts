import { Injectable, RequestMethod, Type } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import 'reflect-metadata';
import {
  ApiOperationOptions,
  ApiResponseOptions,
  ApiBodyOptions,
  getSchemaPath,
} from '@nestjs/swagger';

const DECORATORS = {
  API_OPERATION: 'swagger/apiOperation',
  API_RESPONSE: 'swagger/apiResponse',
  API_PARAMETERS: 'swagger/apiParameters',
  API_BODY: 'swagger/apiRequestBody',
  API_TAGS: 'swagger/apiUseTags',
};

export class SwaggerParameterDTO {
  name: string;
  in: string;
  description?: string;
  required?: boolean;
  type?: string;
  schema?: any;
}

export class SwaggerResponseDTO {
  statusCode: string;
  description?: string;
  type?: string;
  schema?: any;
}

export class SwaggerRequestBodyDTO {
  description?: string;
  required?: boolean;
  content?: {
    [media: string]: {
      schema: any;
    };
  };
}

export interface EndpointInfo {
  method: string;
  path: string;
  controller: string;
  handler: string;
  swaggerInfo?: {
    summary?: string;
    description?: string;
    tags?: string[];
    parameters?: SwaggerParameterDTO[];
    responses?: SwaggerResponseDTO[];
    requestBody?: SwaggerRequestBodyDTO;
    dto?: string;
  };
}

@Injectable()
export class EndpointDiscoveryService {
  public readonly scannedDTOs: Set<string> = new Set();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  async getAllEndpoints(): Promise<EndpointInfo[]> {
    const endpoints: EndpointInfo[] = [];
    const controllers = this.discoveryService.getControllers();

    for (const wrapper of controllers) {
      const { instance, metatype } = wrapper;
      if (!instance || !metatype) continue;

      const controllerPath = this.reflector.get<string>(
        PATH_METADATA,
        metatype,
      );
      const controllerTags: string[] = Reflect.getMetadata(
        DECORATORS.API_TAGS,
        metatype,
      );

      const methodNames = this.metadataScanner.getAllMethodNames(instance);

      for (const methodName of methodNames) {
        const method = instance[methodName];
        if (typeof method !== 'function') continue;

        const methodPath = this.reflector.get<string | undefined>(
          PATH_METADATA,
          method,
        );
        const methodVerb = this.reflector.get<RequestMethod | undefined>(
          METHOD_METADATA,
          method,
        );

        if (methodPath !== undefined && methodVerb !== undefined) {
          const fullPath = this.normalizePath(controllerPath, methodPath);

          const operation: ApiOperationOptions = Reflect.getMetadata(
            DECORATORS.API_OPERATION,
            method,
          );
          const responses: { [statusCode: string]: ApiResponseOptions } =
            Reflect.getMetadata(DECORATORS.API_RESPONSE, method) || {};
          const parameters: any[] =
            Reflect.getMetadata(DECORATORS.API_PARAMETERS, method) || [];
          const requestBody: ApiBodyOptions = Reflect.getMetadata(
            DECORATORS.API_BODY,
            method,
          );

          const extractedParameters: SwaggerParameterDTO[] = [];
          for (const p of parameters) {
            extractedParameters.push({
              name: p.name,
              in: p.in || 'query',
              description: p.description,
              required: p.required,
              type: p.type?.name || p.schema?.type,
              schema: p.schema,
            });
          }

          const extractedResponses: SwaggerResponseDTO[] = [];
          for (const statusCode in responses) {
            const resOpts = responses[statusCode];
            extractedResponses.push({
              statusCode,
              description: resOpts.description,
              type: (resOpts as any)?.type?.name,
              schema: (resOpts as any)?.schema,
            });
          }

          let dtoName: string | undefined;
          let extractedRequestBody: SwaggerRequestBodyDTO | undefined;

          if (requestBody && (requestBody as any)?.type) {
            const typeClass = (requestBody as any)?.type as Type<unknown>;
            dtoName = typeClass?.name;
            if (dtoName) this.scannedDTOs.add(dtoName);
            extractedRequestBody = {
              description: requestBody.description,
              required: requestBody.required,
              content: {
                'application/json': {
                  schema: {
                    $ref: getSchemaPath(typeClass),
                  },
                },
              },
            };
          } else if (requestBody) {
            extractedRequestBody = {
              description: requestBody.description,
              required: requestBody.required,
              content: {
                'application/json': {
                  schema: (requestBody as any)?.schema,
                },
              },
            };
          }

          endpoints.push({
            method: RequestMethod[methodVerb],
            path: fullPath,
            controller: metatype.name,
            handler: methodName,
            swaggerInfo: {
              summary: operation?.summary,
              description: operation?.description,
              tags: operation?.tags || controllerTags,
              parameters: extractedParameters.length
                ? extractedParameters
                : undefined,
              responses: extractedResponses.length
                ? extractedResponses
                : undefined,
              requestBody: extractedRequestBody,
              dto: dtoName,
            },
          });
        }
      }
    }

    return endpoints;
  }

  /**
   * Retrieves all endpoints associated with a specific controller name.
   * @param controllerName The name of the controller (e.g., "FileController").
   * @returns A promise that resolves to an array of EndpointInfo objects.
   */
  async getEndpointsByControllerName(controllerName: string): Promise<EndpointInfo[]> {
    const allEndpoints = await this.getAllEndpoints();
    return allEndpoints.filter(endpoint => endpoint.controller === controllerName);
  }

  private normalizePath(controllerPath: string, methodPath: string): string {
    let fullPath = `/${controllerPath}/${methodPath}`.replace(/\/+/g, '/');
    if (fullPath.endsWith('/') && fullPath.length > 1) {
      fullPath = fullPath.slice(0, -1);
    }
    if (!fullPath.startsWith('/')) {
      fullPath = `/${fullPath}`;
    }
    if (fullPath === '//') {
      fullPath = '/';
    }
    return fullPath;
  }
}