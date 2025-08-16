// src/endpoints/endpoints.controller.ts
import { Controller, Get, Param, NotFoundException } from '@nestjs/common'; // Added Param, NotFoundException
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger'; // Added ApiParam
import {
  EndpointDiscoveryService,
  EndpointInfo,
} from '../common/services/endpoint-discovery.service';

@ApiTags('endpoints')
@Controller('endpoints')
export class EndpointsController {
  constructor(
    private readonly endpointDiscoveryService: EndpointDiscoveryService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List all registered API endpoints with Swagger info',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved all endpoints.',
    type: [Object], // Can't define specific type easily for the recursive EndpointInfo here
  })
  async getAllEndpoints(): Promise<EndpointInfo[]> {
    return this.endpointDiscoveryService.getAllEndpoints();
  }

  @Get(':controllerName')
  @ApiOperation({
    summary: 'List endpoints for a specific controller',
    description:
      'Retrieves all registered API endpoints associated with a given controller name (e.g., "FileController").',
  })
  @ApiParam({
    name: 'controllerName',
    description:
      'The exact name of the controller (e.g., "FileController", "RecordingController"). Case-sensitive.',
    type: String,
    example: 'FileController',
  })
  @ApiResponse({
    status: 200,
    description:
      'Successfully retrieved endpoints for the specified controller.',
    type: [Object],
  })
  @ApiResponse({
    status: 404,
    description: 'No endpoints found for the specified controller name.',
  })
  async getEndpointsByController(
    @Param('controllerName') controllerName: string,
  ): Promise<EndpointInfo[]> {
    const endpoints =
      await this.endpointDiscoveryService.getEndpointsByControllerName(
        controllerName,
      );
    if (endpoints.length === 0) {
      throw new NotFoundException(
        `No endpoints found for controller: "${controllerName}"`,
      );
    }
    return endpoints;
  }
}
