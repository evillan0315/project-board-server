import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { PlannerService } from './planner.service';
import { type PlanDto } from './types';
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('api/planner')
@Controller('plan')
export class PlannerController {
  constructor(private readonly planner: PlannerService) {}

  @ApiOperation({ summary: 'Create a new plan from a prompt' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The prompt to generate the plan from',
          example: 'Implement user authentication with Google OAuth',
        },
      },
      required: []
    },
    examples: {
      examplePrompt: {
        summary: 'Example Prompt',
        description: 'A sample prompt for generating a plan.',
        value: { prompt: 'Implement user authentication with Google OAuth' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'The plan has been successfully created.',
    schema: {
      type: 'object',
      properties: {
        planId: {
          type: 'string',
          description: 'The ID of the generated plan.',
          example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
        },
        plan: {
          type: 'object',
          description: 'The generated plan object.',
          example: {
            title: 'Implement Google OAuth Authentication',
            summary: 'Adds Google OAuth login functionality.',
            changes: [
              {
                filePath: 'src/auth/auth.service.ts',
                action: 'modify',
                newContent: '// Code changes here',
                reason: 'Implement Google OAuth logic'
              }
            ]
          }
        }
      }
    },
  })
  @Post()
  async createPlan(@Body() body: { prompt?: string }) {
    const prompt = body.prompt || '';
    const result = await this.planner.planFromPrompt(prompt);
    return result;
  }

  @ApiOperation({ summary: 'Get a plan by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the plan' })
  @ApiResponse({
    status: 200,
    description: 'The plan details.',
    schema: {
      type: 'object',
      properties: {
        plan: {
          type: 'object',
          description: 'The requested plan object.',
          example: {
            title: 'Implement Google OAuth Authentication',
            summary: 'Adds Google OAuth login functionality.',
            changes: [
              {
                filePath: 'src/auth/auth.service.ts',
                action: 'modify',
                newContent: '// Code changes here',
                reason: 'Implement Google OAuth logic'
              }
            ]
          }
        }
      }
    },
  })
  @Get(':id')
  async getPlan(@Param('id') id: string) {
    const plan = this.planner.getPlan(id);
    return { plan };
  }

  @ApiOperation({ summary: 'Get chunks of a plan by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the plan' })
  @ApiResponse({
    status: 200,
    description: 'The chunks of the plan.',
    schema: {
      type: 'object',
      properties: {
        chunks: {
          type: 'array',
          items: {
            type: 'array',
            description: 'A chunk of file changes.',
            example: [
              {
                filePath: 'src/auth/auth.service.ts',
                action: 'modify',
                newContent: '// Code changes here',
                reason: 'Implement Google OAuth logic'
              }
            ]
          }
        }
      }
    },
  })
  @Get(':id/chunks')
  async getChunks(@Param('id') id: string) {
    const chunks = this.planner.chunkPlan(id);
    return { chunks };
  }

  @ApiOperation({ summary: 'Apply a chunk of a plan by ID and index' })
  @ApiParam({ name: 'id', description: 'The ID of the plan' })
  @ApiParam({ name: 'index', description: 'The index of the chunk to apply' })
  @ApiResponse({ status: 201, description: 'The chunk has been successfully applied.' })
  @Post(':id/apply-chunk/:index')
  async applyChunk(@Param('id') id: string, @Param('index') index: string) {
    const idx = parseInt(index, 10);
    const res = await this.planner.applyChunk(id, idx);
    return res;
  }

  @ApiOperation({ summary: 'Apply a plan' })
  @ApiBody({
    type: PlanDto,
    description: 'The plan to apply',
    examples: {
      examplePlan: {
        summary: 'Example Plan',
        description: 'A sample plan object.',
        value: {
          title: 'Implement Google OAuth Authentication',
          summary: 'Adds Google OAuth login functionality.',
          changes: [
            {
              filePath: 'src/auth/auth.service.ts',
              action: 'modify',
              newContent: '// Code changes here',
              reason: 'Implement Google OAuth logic'
            }
          ]
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'The plan has been successfully applied.' })
  @Post('apply')
  async applyPlan(@Body() body: { plan: PlanDto }) {
    const result = await this.planner.applyPlan(body.plan);
    return result;
  }
}
