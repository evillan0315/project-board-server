// FIlePath: src/planner/planner.controller.ts
// Title: PlannerController with endpoints for creating, applying, and validating plans
// Reason: Optimized routes and aligned with PlannerService & GeneratedPlanDto

import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { PlannerService } from './planner.service';
import {
  GeneratedPlanDto,
  FileChangeDto,
  ApplyExistingPlanRequestDto,
} from './dto';
import { LlmInputDto } from '@/llm/dto/llm-input.dto';
import { validatePlan } from './validator';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Plan')
@Controller('api/plan')
@Roles(Role.ADMIN, Role.DEVELOPER)
export class PlannerController {
  constructor(private readonly planner: PlannerService) {}

  /** Create a plan from structured LLM input and persist */
  @Post('create')
  @ApiOperation({ summary: 'Create a new Plan' })
  @ApiCreatedResponse({
    description: 'Plan successfully created.',
    type: GeneratedPlanDto,
  })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  createPlan(@Body() dto: GeneratedPlanDto, @CurrentUser('id') userId: string) {
    return this.planner.createPlan(dto, dto.llmInput as LlmInputDto, userId);
  }

  /** Generate a new plan from an LLM prompt */
  @Post('generate')
  @ApiOperation({ summary: 'Generate a plan from LLM input' })
  @ApiBody({ type: LlmInputDto })
  @ApiResponse({ status: 201, description: 'Plan successfully generated.' })
  async generatePlan(
    @Body() llmInput: LlmInputDto,
    @CurrentUser('id') userId: string,
  ) {
    const rawPlanJson = await this.planner.generatePlan(llmInput);
    if (!rawPlanJson)
      throw new BadRequestException('LLM did not return a plan.');
    return { rawPlanJson };
  }

  /** Get a plan by ID */
  @Get(':id')
  @ApiOperation({ summary: 'Get a plan by ID' })
  @ApiParam({ name: 'id' })
  async getPlan(@Param('id') id: string) {
    const plan = await this.planner.getPlan(id);
    return { plan };
  }

  /** Get chunks of a plan by ID */
  @Get(':id/chunks')
  @ApiOperation({ summary: 'Get plan chunks by ID' })
  @ApiParam({ name: 'id' })
  async getChunks(@Param('id') id: string) {
    const chunks = await this.planner.chunkPlan(id);
    return { chunks };
  }

  /** Apply a chunk of a plan by index */
  @Post(':id/apply-chunk/:index')
  @ApiOperation({ summary: 'Apply a chunk of a plan' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'index' })
  async applyChunk(@Param('id') id: string, @Param('index') index: string) {
    const idx = parseInt(index, 10);
    return await this.planner.applyChunk(id, idx);
  }

  /** Apply a full plan */
  @Post('apply')
  @ApiOperation({ summary: 'Apply a full plan' })
  @ApiBody({ type: ApplyExistingPlanRequestDto })
  async applyPlan(@Body() body: ApplyExistingPlanRequestDto) {
    return await this.planner.applyPlan(body.planId, body.projectRoot);
  }

  /** Directly execute a list of changes (for testing executor) */
  @Post('execute-chunk')
  @ApiOperation({ summary: 'Directly execute a list of changes' })
  @ApiBody({
    type: [FileChangeDto],
    description: 'Array of file changes to execute',
  })
  async executeChunk(@Body() changes: FileChangeDto[]) {
    if (!Array.isArray(changes)) {
      throw new BadRequestException('Invalid changes array');
    }
    return await this.planner['executor'].snapshotAndApply(
      'manual-execution',
      changes,
    );
  }

  /** Validate a plan object without persisting */
  @Post('validate')
  @ApiOperation({ summary: 'Validate a plan object against schema' })
  @ApiBody({ type: GeneratedPlanDto, description: 'Plan object to validate' })
  async validatePlanEndpoint(@Body() plan: any) {
    try {
      const validated = validatePlan(plan);
      return { ok: true, validated };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Validation failed' };
    }
  }
}
