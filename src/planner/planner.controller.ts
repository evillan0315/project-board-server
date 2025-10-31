import { Controller, Post, Body, Param, Get, UseGuards, Req } from '@nestjs/common';
import { PlannerService } from './planner.service';
import { GeneratedPlanDto, ApplyExistingPlanRequestDto } from './dto'; // Changed PlanDto to GeneratedPlanDto, added ApplyExistingPlanRequestDto
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LlmInputDto } from '@/llm/dto/llm-input.dto';
import { JwtAuthGuard } from '@/auth/auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator'; // Import CurrentUser decorator
import { Role } from '@prisma/client';
import { Request } from 'express';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('AI Planner')
@Controller('api/plan')
@Roles(Role.ADMIN, Role.DEVELOPER) // Restrict access to ADMIN and DEVELOPER users
export class PlannerController {
  constructor(private readonly planner: PlannerService) {}

  @ApiOperation({ summary: 'Generate a new plan from a structured LLM input' })
  @ApiBody({
    type: LlmInputDto,
    description: 'The structured input for generating a plan.',
  })
  @ApiResponse({
    status: 201,
    description: 'The plan has been successfully generated.',
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
        },
      },
    },
  })
  @Post()
  async generatePlan(
    @Body() llmInput: LlmInputDto,
    @CurrentUser('id') userId: string, // Inject userId from JWT payload
  ) {
    const result = await this.planner.planFromPrompt(llmInput, userId);
    return result;
  }

  @ApiOperation({ summary: 'Get a plan by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the plan' })
  @ApiResponse({ status: 200, description: 'The plan details.' })
  @Get(':id')
  async getPlan(@Param('id') id: string) {
    const plan = await this.planner.getPlan(id);
    return { plan };
  }

  @ApiOperation({ summary: 'Get chunks of a plan by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the plan' })
  @ApiResponse({ status: 200, description: 'The chunks of the plan.' })
  @Get(':id/chunks')
  async getChunks(@Param('id') id: string) {
    const chunks = await this.planner.chunkPlan(id);
    return { chunks };
  }

  @ApiOperation({ summary: 'Apply a chunk of a plan by ID and index' })
  @ApiParam({ name: 'id', description: 'The ID of the plan' })
  @ApiParam({ name: 'index', description: 'The index of the chunk to apply' })
  @ApiResponse({
    status: 201,
    description: 'The chunk has been successfully applied.',
  })
  @Post(':id/apply-chunk/:index')
  async applyChunk(@Param('id') id: string, @Param('index') index: string) {
    const idx = parseInt(index, 10);
    const res = await this.planner.applyChunk(id, idx);
    return res;
  }

  @ApiOperation({ summary: 'Apply a plan by its ID' })
  @ApiBody({
    type: ApplyExistingPlanRequestDto,
    description: 'The ID of the plan to apply, and optionally a project root.',
  })
  @ApiResponse({
    status: 201,
    description: 'The plan has been successfully applied.',
  })
  @Post('apply')
  async applyPlan(
    @Body() body: ApplyExistingPlanRequestDto,
    @CurrentUser('id') userId: string, // userId is no longer directly used in service applyPlan but kept here if other logic needed it
  ) {
    const result = await this.planner.applyPlan(body.planId, body.projectRoot);
    return result;
  }
}
