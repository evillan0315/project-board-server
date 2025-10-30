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

import { ExecutionSnapshotService } from './execution-snapshot.service';
import {
  CreateExecutionSnapshotDto,
  PaginationExecutionSnapshotResultDto,
  PaginationExecutionSnapshotQueryDto,
} from './dto/create-execution-snapshot.dto';
import { UpdateExecutionSnapshotDto } from './dto/update-execution-snapshot.dto';



@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)


@ApiTags(
  'ExecutionSnapshot'
)
@Controller('api/execution-snapshot')
export class ExecutionSnapshotController {
  constructor(private readonly executionSnapshotService: ExecutionSnapshotService) {}
  
  
  
  // ───────────────────────────────────────────────────────────
  // CREATE
  // ───────────────────────────────────────────────────────────

  @Post()
  
  @Roles(UserRole.ADMIN)
  
  @ApiOperation({ summary: 'Create a new ExecutionSnapshot' })
  @ApiCreatedResponse({ description: 'Successfully created.', type: CreateExecutionSnapshotDto })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  create(@Body() dto: CreateExecutionSnapshotDto) {
    return this.executionSnapshotService.create(dto);
  }

  // ───────────────────────────────────────────────────────────
  // FIND ALL
  // ───────────────────────────────────────────────────────────

  @Get()
  
  @Roles(UserRole.ADMIN)
  
  @ApiOperation({ summary: 'Retrieve all ExecutionSnapshot records' })
  @ApiOkResponse({ description: 'List of ExecutionSnapshot records.', type: [CreateExecutionSnapshotDto] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  findAll() {
    return this.executionSnapshotService.findAll();
  }

  // ───────────────────────────────────────────────────────────
  // PAGINATED
  // ───────────────────────────────────────────────────────────

  @Get('paginated')

@Roles(UserRole.ADMIN)

@ApiOperation({ summary: 'Paginated ExecutionSnapshot records' })
@ApiResponse({
  status: HttpStatus.OK,
  description: 'Paginated results',
  type: PaginationExecutionSnapshotResultDto,
})
findAllPaginated(@Query() query: PaginationExecutionSnapshotQueryDto) {
  return this.executionSnapshotService.findAllPaginated(query);
}


  // ───────────────────────────────────────────────────────────
  // FIND ONE
  // ───────────────────────────────────────────────────────────

  @Get(':id')
  
  @Roles(UserRole.ADMIN)
  
  @ApiOperation({ summary: 'Find ExecutionSnapshot by ID' })
  @ApiOkResponse({ description: 'Record found.', type: CreateExecutionSnapshotDto })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  findOne(@Param('id') id: string) {
    return this.executionSnapshotService.findOne(id);
  }

  // ───────────────────────────────────────────────────────────
  // UPDATE
  // ───────────────────────────────────────────────────────────

  @Patch(':id')
  
  @Roles(UserRole.ADMIN)
  
  @ApiOperation({ summary: 'Update ExecutionSnapshot by ID' })
  @ApiOkResponse({ description: 'Successfully updated.', type: UpdateExecutionSnapshotDto })
  @ApiBadRequestResponse({ description: 'Invalid data.' })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  update(@Param('id') id: string, @Body() dto: UpdateExecutionSnapshotDto) {
    return this.executionSnapshotService.update(id, dto);
  }

  // ───────────────────────────────────────────────────────────
  // DELETE
  // ───────────────────────────────────────────────────────────

  @Delete(':id')
  
  @Roles(UserRole.ADMIN)
  
  @ApiOperation({ summary: 'Delete ExecutionSnapshot by ID' })
  @ApiOkResponse({ description: 'Successfully deleted.' })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  remove(@Param('id') id: string) {
    return this.executionSnapshotService.remove(id);
  }
}

