import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OpenviduService } from './openvidu.service';
import { CreateOpenViduSessionDto } from './dto/create-openvidu-session.dto';
import {
  GenerateOpenViduTokenDto,
  OpenViduRole,
} from './dto/generate-openvidu-token.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';

@ApiTags('OpenVidu')
@Controller('api/openvidu') // Changed controller path to include 'api/' prefix
@UseGuards(JwtAuthGuard, RolesGuard) // Protect all OpenVidu endpoints
@ApiBearerAuth()
export class OpenviduController {
  constructor(private readonly openviduService: OpenviduService) {}

  @Post('sessions')
  @Roles(UserRole.ADMIN, UserRole.USER) // Adjust roles as needed
  @ApiOperation({ summary: 'Create a new OpenVidu session' })
  @ApiResponse({
    status: 201,
    description: 'Session created successfully.',
    type: String,
  }) // Return type is just sessionId
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiResponse({ status: 500, description: 'Failed to create session.' })
  async createSession(
    @Body() createSessionDto: CreateOpenViduSessionDto,
  ): Promise<{ sessionId: string }> {
    const session = await this.openviduService.createSession(
      createSessionDto.customSessionId,
    );
    return { sessionId: session.sessionId };
  }

  @Post('tokens')
  @Roles(UserRole.ADMIN, UserRole.USER) // Adjust roles as needed
  @ApiOperation({ summary: 'Generate a new OpenVidu token for a session' })
  @ApiResponse({
    status: 201,
    description: 'Token generated successfully.',
    type: String,
  }) // Return type is just token
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiResponse({ status: 500, description: 'Failed to generate token.' })
  async generateToken(
    @Body() generateTokenDto: GenerateOpenViduTokenDto,
  ): Promise<{ token: string }> {
    const token = await this.openviduService.generateToken(generateTokenDto);
    return { token };
  }

  @Delete('sessions/:sessionId')
  @Roles(UserRole.ADMIN, UserRole.USER) // Only admins or session creators should delete sessions
  @ApiOperation({ summary: 'Delete an OpenVidu session' })
  @ApiResponse({ status: 200, description: 'Session deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  @ApiResponse({ status: 500, description: 'Failed to delete session.' })
  async deleteSession(
    @Param('sessionId') sessionId: string,
  ): Promise<{ success: boolean }> {
    await this.openviduService.deleteSession(sessionId);
    return { success: true };
  }

  @Get('sessions')
  @Roles(UserRole.ADMIN) // Only admins should see all active sessions
  @ApiOperation({ summary: 'Get all active OpenVidu session IDs' })
  @ApiResponse({
    status: 200,
    description: 'List of active session IDs.',
    type: [String],
  })
  async getActiveSessions(): Promise<string[]> {
    return this.openviduService.getActiveSessionIds();
  }
}
