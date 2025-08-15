// src/manifest/manifest.controller.ts
import {
  Controller,
  Get,
  Post,
  Res,
  Body,
  OnModuleInit,
  Logger,
  Param,
} from '@nestjs/common';
import { Response } from 'express';
import { ManifestService } from './manifest.service';
import {
  FaviconGenerationOptions,
  WebManifestOptions,
} from './interfaces/manifest-options.interface';
import * as path from 'path';
import * as fs from 'fs-extra';

@Controller('/') // Or '/manifest' if you want a base path
export class ManifestController implements OnModuleInit {
  private readonly logger = new Logger(ManifestController.name);
  private generatedManifestIcons: any[] = []; // Store generated icons to use in the manifest
  private generatedHtmlLinks: string[] = []; // Store generated HTML link tags
  private readonly PUBLIC_DIR = path.join(__dirname, '..', '..', 'public'); // Adjust as per your project structure
  private readonly ICONS_SUBDIR = 'icons';
  private readonly ICONS_OUTPUT_DIR = path.join(
    this.PUBLIC_DIR,
    this.ICONS_SUBDIR,
  );
  private readonly ICONS_PUBLIC_PATH = `/${this.ICONS_SUBDIR}`; // Public URL path

  constructor(private readonly manifestService: ManifestService) {}

  async onModuleInit() {
    this.logger.log('Initializing manifest and favicons...');
    // IMPORTANT: In a real application, you'd likely trigger this once
    // on deployment or via an admin interface, not every app startup,
    // especially if sourceImagePath is static.
    // For demonstration, we run it on startup.

    const sourceImage = path.join(__dirname, '..', '..', 'assets', 'logo.png'); // Path to your source image
    // Ensure 'assets' directory exists and contains 'logo.png'
    // You might need to adjust this path based on your build output.
    // For local development, assuming `assets` next to `src`.

    const faviconOptions: FaviconGenerationOptions = {
      sourceImagePath: sourceImage,
      outputDirectory: this.ICONS_OUTPUT_DIR,
      publicPath: this.ICONS_PUBLIC_PATH,
    };

    try {
      const { manifestIcons, htmlLinkTags } =
        await this.manifestService.generateFavicons(faviconOptions);
      this.generatedManifestIcons = manifestIcons;
      this.generatedHtmlLinks = htmlLinkTags.map((tag) =>
        this.manifestService.generateHtmlLinkTags([tag]),
      ); // convert array of objects to string

      this.logger.log('Favicons generated and ready.');
      this.logger.debug(
        'Generated HTML link tags:\n' + this.generatedHtmlLinks.join('\n'),
      );

      // Also ensure the public directory itself is created if not already
      await fs.ensureDir(this.PUBLIC_DIR);
    } catch (error) {
      this.logger.error(
        `Failed to generate favicons on startup: ${error.message}`,
      );
      // Depending on your requirements, you might want to stop the app or log more severely
    }
  }

  @Get('manifest.json')
  getWebManifest(@Res() res: Response) {
    const manifestConfig: WebManifestOptions = {
      name: 'My Awesome NestJS App',
      short_name: 'NestApp',
      description: 'A fullstack application built with NestJS.',
      start_url: '/',
      display: 'standalone', // or 'fullscreen', 'minimal-ui', 'browser'
      background_color: '#ffffff',
      theme_color: '#317EFB',
      icons: this.generatedManifestIcons, // Use the dynamically generated icons
    };

    const manifest = this.manifestService.generateWebManifest(manifestConfig);
    res.setHeader('Content-Type', 'application/manifest+json');
    res.json(manifest);
  }

  // Optional: Endpoint to trigger favicon generation manually (e.g., for an admin panel)
  @Post('generate-favicons')
  async triggerFaviconGeneration(@Res() res: Response) {
    const sourceImage = path.join(__dirname, '..', '..', 'assets', 'logo.png'); // Adjust as needed
    const faviconOptions: FaviconGenerationOptions = {
      sourceImagePath: sourceImage,
      outputDirectory: this.ICONS_OUTPUT_DIR,
      publicPath: this.ICONS_PUBLIC_PATH,
    };

    try {
      const { manifestIcons, htmlLinkTags } =
        await this.manifestService.generateFavicons(faviconOptions);
      this.generatedManifestIcons = manifestIcons;
      this.generatedHtmlLinks = htmlLinkTags.map((tag) =>
        this.manifestService.generateHtmlLinkTags([tag]),
      );

      res.status(200).json({
        message: 'Favicons and manifest icons regenerated successfully!',
        manifestIcons,
        htmlLinkTags: this.generatedHtmlLinks,
      });
    } catch (error) {
      this.logger.error('Error generating favicons via API:', error.stack);
      res.status(500).json({
        message: 'Failed to generate favicons.',
        error: error.message,
      });
    }
  }

  // This endpoint can return the HTML link tags to be injected into your front-end.
  // In a real app, you'd integrate this into your SSR/templating engine.
  @Get('favicon-links')
  getFaviconHtmlLinks(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html');
    res.send(this.generatedHtmlLinks.join('\n'));
  }
}
