import { Controller, Get, Post, Req, Res, Body, Render } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { EnvSetupService } from './env-setup.service';

@ApiTags('Setup')
@Controller('setup')
export class SetupController {
  constructor(private readonly envSetupService: EnvSetupService) {}

  @Get()
  @Render('pages/setup')
  @ApiOperation({ summary: 'Render server setup page' })
  @ApiResponse({ status: 200, description: 'Setup page rendered' })
  setup(@Req() req: Request) {
    const env = this.envSetupService.readEnvFile();

    return {
      title: 'Server setup',
      description:
        'The Server Setup page guides administrators through the initial configuration required to run the application. This includes setting up essential environment variables, configuring database connections, and preparing the system for secure and reliable operation. If the application detects a missing or incomplete .env file, users are automatically redirected here to complete the setup process. This ensures that the server environment is properly initialized before accessing the core features of the system.',
      layout: 'layouts/index',
      env,
    };
  }
  @Post()
  @ApiOperation({ summary: 'Generate or update .env file' })
  @ApiResponse({ status: 302, description: '.env file created or updated' })
  async generateEnv(@Body() body: Record<string, any>, @Res() res: Response) {
    this.envSetupService.generateOrUpdateEnvFile(body);
    return res.redirect('/');
  }
}
