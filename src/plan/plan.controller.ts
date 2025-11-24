import {
  Controller,
  Get,
  Post,
  Res,
  Req,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  HttpStatus,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  InternalServerErrorException
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiQuery,
  ApiResponse,
  ApiConsumes,
  ApiBody
} from '@nestjs/swagger';
import axios from 'axios';

import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

import { PlanService } from './plan.service';
import {
  CreatePlanDto,
  PaginationPlanResultDto,
  PaginationPlanQueryDto,
} from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';



@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)


@ApiTags(
  'AI Planner'
)
@Controller('api/planner')
export class PlanController {
  constructor(private readonly planService: PlanService) {}
  
  
  
  // ───────────────────────────────────────────────────────────
  // CREATE
  // ───────────────────────────────────────────────────────────

  @Post()
  
  @Roles(UserRole.ADMIN)
  
  @ApiOperation({ summary: 'Create a new Plan' })
  @ApiCreatedResponse({ description: 'Successfully created.', type: CreatePlanDto })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  create(@Body() dto: CreatePlanDto) {
    return this.planService.create(dto);
  }

  // ───────────────────────────────────────────────────────────
  // FIND ALL
  // ───────────────────────────────────────────────────────────

  @Get()
  
  @Roles(UserRole.ADMIN)
  
  @ApiOperation({ summary: 'Retrieve all Plan records' })
  @ApiOkResponse({ description: 'List of Plan records.', type: [CreatePlanDto] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  findAll() {
    return this.planService.findAll();
  }

  // ───────────────────────────────────────────────────────────
  // PAGINATED
  // ───────────────────────────────────────────────────────────

  @Get('paginated')

@Roles(UserRole.ADMIN)

@ApiOperation({ summary: 'Paginated Plan records' })
@ApiResponse({
  status: HttpStatus.OK,
  description: 'Paginated results',
  type: PaginationPlanResultDto,
})
findAllPaginated(@Query() query: PaginationPlanQueryDto) {
  return this.planService.findAllPaginated(query);
}


  // ───────────────────────────────────────────────────────────
  // FIND ONE
  // ───────────────────────────────────────────────────────────

  @Get(':id')
  
  @Roles(UserRole.ADMIN)
  
  @ApiOperation({ summary: 'Find Plan by ID' })
  @ApiOkResponse({ description: 'Record found.', type: CreatePlanDto })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  findOne(@Param('id') id: string) {
    return this.planService.findOne(id);
  }

  // ───────────────────────────────────────────────────────────
  // UPDATE
  // ───────────────────────────────────────────────────────────

  @Patch(':id')
  
  @Roles(UserRole.ADMIN)
  
  @ApiOperation({ summary: 'Update Plan by ID' })
  @ApiOkResponse({ description: 'Successfully updated.', type: UpdatePlanDto })
  @ApiBadRequestResponse({ description: 'Invalid data.' })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.planService.update(id, dto);
  }

  // ───────────────────────────────────────────────────────────
  // DELETE
  // ───────────────────────────────────────────────────────────

  @Delete(':id')
  
  @Roles(UserRole.ADMIN)
  
  @ApiOperation({ summary: 'Delete Plan by ID' })
  @ApiOkResponse({ description: 'Successfully deleted.' })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  remove(@Param('id') id: string) {
    return this.planService.remove(id);
  }
}

