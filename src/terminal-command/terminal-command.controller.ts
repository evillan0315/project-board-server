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

import { TerminalCommandService } from './terminal-command.service';
import {
  CreateTerminalCommandDto,
  PaginationTerminalCommandResultDto,
  PaginationTerminalCommandQueryDto,
} from './dto/create-terminal-command.dto';
import { UpdateTerminalCommandDto } from './dto/update-terminal-command.dto';



@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)


@ApiTags(
  'TerminalCommand'
)
@Controller('api/terminal-command')
export class TerminalCommandController {
  constructor(private readonly terminalCommandService: TerminalCommandService) {}
  
  
  
  // ───────────────────────────────────────────────────────────
  // CREATE
  // ───────────────────────────────────────────────────────────

  @Post()
  
  @Roles(UserRole.ADMIN)
  
  @ApiOperation({ summary: 'Create a new TerminalCommand' })
  @ApiCreatedResponse({ description: 'Successfully created.', type: CreateTerminalCommandDto })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  create(@Body() dto: CreateTerminalCommandDto) {
    return this.terminalCommandService.create(dto);
  }

  // ───────────────────────────────────────────────────────────
  // FIND ALL
  // ───────────────────────────────────────────────────────────

  @Get()
  
  @Roles(UserRole.ADMIN)
  
  @ApiOperation({ summary: 'Retrieve all TerminalCommand records' })
  @ApiOkResponse({ description: 'List of TerminalCommand records.', type: [CreateTerminalCommandDto] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  findAll() {
    return this.terminalCommandService.findAll();
  }

  // ───────────────────────────────────────────────────────────
  // PAGINATED
  // ───────────────────────────────────────────────────────────

  @Get('paginated')

@Roles(UserRole.ADMIN)

@ApiOperation({ summary: 'Paginated TerminalCommand records' })
@ApiResponse({
  status: HttpStatus.OK,
  description: 'Paginated results',
  type: PaginationTerminalCommandResultDto,
})
findAllPaginated(@Query() query: PaginationTerminalCommandQueryDto) {
  return this.terminalCommandService.findAllPaginated(query);
}


  // ───────────────────────────────────────────────────────────
  // FIND ONE
  // ───────────────────────────────────────────────────────────

  @Get(':id')
  
  @Roles(UserRole.ADMIN)
  
  @ApiOperation({ summary: 'Find TerminalCommand by ID' })
  @ApiOkResponse({ description: 'Record found.', type: CreateTerminalCommandDto })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  findOne(@Param('id') id: string) {
    return this.terminalCommandService.findOne(id);
  }

  // ───────────────────────────────────────────────────────────
  // UPDATE
  // ───────────────────────────────────────────────────────────

  @Patch(':id')
  
  @Roles(UserRole.ADMIN)
  
  @ApiOperation({ summary: 'Update TerminalCommand by ID' })
  @ApiOkResponse({ description: 'Successfully updated.', type: UpdateTerminalCommandDto })
  @ApiBadRequestResponse({ description: 'Invalid data.' })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  update(@Param('id') id: string, @Body() dto: UpdateTerminalCommandDto) {
    return this.terminalCommandService.update(id, dto);
  }

  // ───────────────────────────────────────────────────────────
  // DELETE
  // ───────────────────────────────────────────────────────────

  @Delete(':id')
  
  @Roles(UserRole.ADMIN)
  
  @ApiOperation({ summary: 'Delete TerminalCommand by ID' })
  @ApiOkResponse({ description: 'Successfully deleted.' })
  @ApiNotFoundResponse({ description: 'Record not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  remove(@Param('id') id: string) {
    return this.terminalCommandService.remove(id);
  }
}

