// File: /media/eddie/Data/projects/nestJS/nest-modules/full-stack/src/app.module.ts

import { Module } from '@nestjs/common';
import * as path from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule } from '@nestjs/config';
import { DiscoveryModule } from '@nestjs/core'; // Important for DiscoveryService

import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { FileModule } from './file/file.module';
import { UtilsModule } from './utils/utils.module';
import { DatabaseModule } from './database/database.module';
import { TerminalModule } from './terminal/terminal.module';
import { FolderModule } from './folder/folder.module';
import { GoogleModule } from './google/google.module';
//import { GoogleOAuthService } from './google/google-oauth/google-oauth.service';
import { SchemaModule } from './schema/schema.module';
import { LogModule } from './log/log.module';
import { AudioModule } from './audio/audio.module';
import { SetupModule } from './setup/setup.module';
//import { ScreenRecorderModule } from './screen-recorder/screen-recorder.module';
import { AwsModule } from './aws/aws.module';
import { TranspilerModule } from './transpiler/transpiler.module';
import { CodeModule } from './code/code.module';
import { FeatureModule } from './feature/feature.module';
import { ModuleControlModule } from './module-control/module-control.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FfmpegModule } from './ffmpeg/ffmpeg.module';
import { GeminiRequestModule } from './gemini-request/gemini-request.module';
import { GeminiResponseModule } from './gemini-response/gemini-response.module';
import { RecordingModule } from './recording/recording.module';
//import { ChatGptModule } from './openai/chatgpt/chatgpt.module';
import { AccountModule } from './account/account.module';
import { OrganizationModule } from './organization/organization.module';
import { ProjectModule } from './project/project.module';
import { SchemaSubmissionModule } from './schema-submission/schema-submission.module';
import { IconModule } from './icon/icon.module';

import { CodeExtractorModule } from './code-extractor/code-extractor.module';
import { ManifestModule } from './manifest/manifest.module';

import { EndpointDiscoveryService } from './common/services/endpoint-discovery.service';
import { EndpointsController } from './endpoints/endpoints.controller';
import { ConversationModule } from './conversation/conversation.module';
import { EndpointConstantsGeneratorService } from './common/services/endpoint-constants-generator.service';
import { ResumeModule } from './resume/resume.module';
import { ReposModule } from './repos/repos.module';
import { SystemInstructionModule } from './system-instruction/system-instruction.module';
import { EslintModule } from './eslint/eslint.module';
import { LlmModule } from './llm/llm.module';

import fileConfig from './config/file.config';

/**
 * The root module of the NestJS application.
 *
 * This module imports and organizes all the other modules within the application.
 * It also configures global settings like static file serving and configuration loading.
 */
@Module({
  imports: [
    DiscoveryModule,
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      // Load configuration from the JSON file
      // __dirname is the directory of the current file (src/app.module.ts)
      // path.resolve moves up one directory (to project root) then into 'config'
      load: [
        fileConfig,
        () =>
          require(
            path.resolve(process.cwd(), 'src/config/feature-modules.json'),
          ),
        // Dynamically load feature-modules.json
        // Use path.join for cross-platform compatibility
      ],
      isGlobal: true, // Makes ConfigService available globally
      // If you also use .env files, you can add them:
      // envFilePath: ['.env'],
    }),
    /**
     * Module for serving static files (e.g., images, CSS, JavaScript).
     *
     * `rootPath` specifies the directory containing the static files (in this case, 'assets').
     * `serveRoot` specifies the URL path under which the static files will be served (in this case, '/assets').
     */
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'downloads/videos/hls'),
      serveRoot: '/hls', // URL path where the assets are served
    }),
    EventEmitterModule.forRoot(),
    ModuleControlModule,
    /**
     * Authentication module for handling user authentication and authorization.
     */
    AuthModule,
    //FfmpegModule,

    /**
     * Module for sending emails.
     */
    MailModule,

    /**
     * Prisma module for database access using Prisma ORM.
     */
    PrismaModule,

    /**
     * Module for managing user-related operations.
     */
    UserModule,

    /**
     * Module for handling file storage and retrieval.
     */
    FileModule,

    /**
     * Module containing utility functions.
     */
    UtilsModule,

    /**
     * Module for database-related operations.
     */
    //DatabaseModule,

    /**
     * Module for interacting with the terminal.
     */
    TerminalModule,

    /**
     * Module for managing folders.
     */
    FolderModule,

    /**
     * Module for Google-related services (e.g., OAuth).
     */
    GoogleModule,

    /**
     * Module for schema management.
     */
    SchemaModule,

    /**
     * Module for logging application events.
     */
    LogModule,

    /**
     * Module for audio processing and management.
     */
    AudioModule,
    ResumeModule,
    /**
     * Configuration module for loading environment variables and configurations.
     *
     * `isGlobal: true` makes this module available throughout the application without needing to import it in other modules.
     * `load: [fileConfig]` loads the file configuration from './config/file.config'.
     */

    /**
     * Module for initial setup and configuration.
     */
    SetupModule,
    /**
     * Module for screen recording functionality.
     */
    //ScreenRecorderModule,
    AwsModule,
    TranspilerModule,
    //CodeModule,
    FeatureModule,
    FfmpegModule,
    GeminiRequestModule,
    GeminiResponseModule,
    RecordingModule,
    AccountModule,
    OrganizationModule,
    ProjectModule,
    SchemaSubmissionModule,
    IconModule,
    CodeExtractorModule,
    ManifestModule,
    ConversationModule,
    ReposModule,
    SystemInstructionModule,
    EslintModule,
    LlmModule,
  ],
  /**
   * Controllers defined in this module.  Controllers handle incoming requests and route them to appropriate handlers.
   */
  controllers: [AppController, EndpointsController],

  /**
   * Providers defined in this module. Providers offer services or functionality that can be injected into controllers and other providers.
   */
  providers: [
    AppService,
    EndpointDiscoveryService,
    EndpointConstantsGeneratorService,
  ],
})
export class AppModule {}
