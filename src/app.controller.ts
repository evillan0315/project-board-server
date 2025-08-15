import {
  Controller,
  Get,
  Render,
  Query,
  Body,
  Redirect,
  Post,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as jwt from 'jsonwebtoken';

import { JwtAuthGuard } from './auth/auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { UserRole } from './auth/enums/user-role.enum';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { RegisterDto, LoginDto } from './auth/dto/auth.dto';
import { CurrentUser } from './auth/decorators/current-user.decorator';

/**
 * AppController handles the main routes of the application, including the homepage,
 * dashboard, login, logout, and other protected pages. It uses guards to protect
 * certain routes and renders views using Handlebars.
 */
@ApiTags('App')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Handles the root route and renders the homepage.  If the .env file is missing,
   * it redirects the user to the setup page.
   *
   * @param {Request} req The Express Request object.
   * @param {Response} res The Express Response object.
   * @returns {Promise<void>} A promise that resolves when the homepage is rendered or the user is redirected.
   */
  @Get()
  @Render('pages/index')
  @ApiOperation({ summary: 'Redirect to setup if .env is missing' })
  @ApiResponse({ status: 200, description: 'Homepage rendered' })
  async home(@Req() req: Request, @Res() res: Response) {
    const envPath = path.resolve(process.cwd(), '.env');

    if (!fs.existsSync(envPath)) {
      return res.redirect('/setup');
    }

    return res.render('pages/index', {
      title: 'Home',
      description: 'Welcome to NestJS + HBS + SolidJS!',
      isAuthenticated: Boolean(req.cookies?.accessToken),
      layout: 'layouts/index',
    });
  }

  /**
   * Handles the 'login' route and renders the login page.
   *
   * @param {Request} req The Express Request object.
   * @returns {Promise<object>} An object containing a message and authentication status.
   */
  @Get('login')
  @Render('pages/index')
  @ApiOperation({ summary: 'Render login page' })
  @ApiQuery({ name: 'error', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Login page rendered' })
  @ApiResponse({ status: 302, description: 'Redirected if already logged in' })
  async getLogin(@Req() req: Request) {
    const token = req.cookies?.accessToken;

    return {
      message: `Please Login`,
      isAuthenticated: Boolean(req.cookies?.accessToken),
    };
  }
  /**
   * Handles the 'editor' route and renders a protected editor page.
   * Requires a valid JWT and specific user roles (ADMIN, USER, MANAGER).
   *
   * @param {Request} req The Express Request object.
   * @returns {object} An object containing a message and authentication status.
   */
  @Get('editor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.MANAGER)
  @Render('pages/index')
  @ApiOperation({ summary: 'Render protected editor page' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Editor rendered' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient role' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getEditor(@Req() req: Request) {
    return {
      message: `Code Editor`,
      isAuthenticated: Boolean(req.cookies?.accessToken),
    };
  }
  /*@Get('editor')
  @Render('pages/monaco')
  getEditor(@Query('filepath') filepath: string, @Query('url') url: string) {
    return {
      title: 'Monaco',
      filepath,
      url,
      language: 'javascript', // could be made dynamic from the extension
      layout: 'layouts/editor',
    };
  }*/
  /**
   * Handles the 'logout' route and renders the logout page.
   * Clears the 'accessToken' cookie to log the user out.
   *
   * @param {Request} req The Express Request object.
   * @param {Response} res The Express Response object.
   * @returns {Promise<{ url: string }>} An object containing the URL to redirect to.
   */
  @Get('logout')
  @Render('pages/index')
  @ApiOperation({ summary: 'Render logout page' })
  @ApiQuery({ name: 'error', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Logout page rendered' })
  @ApiResponse({ status: 302, description: 'Redirected if already logged in' })
  async getLogout(@Req() req: Request, @Res() res: Response) {
    res.clearCookie('accessToken');
    return { url: '/login' };
  }

  /**
   * Handles the POST request to the 'logout' route.
   * Clears the 'accessToken' cookie and redirects the user to the login page.
   *
   * @param {Response} res The Express Response object with passthrough enabled.
   * @returns {{ url: string }} An object containing the URL to redirect to.
   */
  @Post('logout')
  @Redirect('/login')
  @ApiOperation({ summary: 'Log out a user and clear JWT cookie' })
  @ApiResponse({
    status: 200,
    description: 'User logged out successfully and redirected',
  })
  async handleLogout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return { url: '/login' };
  }
}
