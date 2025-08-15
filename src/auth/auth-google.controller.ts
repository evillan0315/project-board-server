import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  Get,
  Req,
  BadRequestException,
  Query,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, CreateJwtUserDto } from './dto/auth.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

import { GoogleAuthGuard } from './guards/google.guard';
import { JwtAuthGuard } from './auth.guard';
import { Response, Request } from 'express';

@ApiTags('Auth')
@Controller('api/auth-google')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}
  /*@Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth2 login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google login' })
  async googleAuth() {
    // Initiates the Google OAuth2 login flow
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Handle Google OAuth2 callback and issue JWT token' })
  @ApiResponse({ status: 200, description: 'Google login successful with JWT issued' })
  @ApiResponse({ status: 401, description: 'Unauthorized or failed login attempt' })
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = req.user;

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken  = await this.authService.generateToken(payload);
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });


    return res.json({
      message: 'Google login successful',
      token,
      user,
    });
  }*/
}
