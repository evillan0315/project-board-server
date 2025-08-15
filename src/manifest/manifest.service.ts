// src/manifest/manifest.service.ts
import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs-extra'; // Using fs-extra for promise-based file operations and ensureDir
import {
  WebManifestOptions,
  ManifestIcon,
  FaviconGenerationOptions,
  GeneratedIcon,
  HtmlLinkTag,
} from './interfaces/manifest-options.interface';

@Injectable()
export class ManifestService {
  private readonly logger = new Logger(ManifestService.name);

  // Default sizes for common favicons and manifest icons
  private readonly DEFAULT_ICON_SIZES = [
    16, // Favicon (legacy)
    32, // Favicon
    48, // Favicon
    57, // Apple Touch Icon (old iPhone)
    60, // Apple Touch Icon (old iPhone)
    72, // Apple Touch Icon (iPad)
    76, // Apple Touch Icon (iPad)
    96, // Android Chrome icon
    114, // Apple Touch Icon (iPhone Retina)
    120, // Apple Touch Icon (iPhone Retina)
    144, // Apple Touch Icon (iPad Retina)
    152, // Apple Touch Icon (iPad Retina)
    180, // Apple Touch Icon (iPhone 6 Plus)
    192, // Android Chrome icon
    512, // Android Chrome icon (splash screen)
  ];

  /**
   * Generates a set of favicons from a source image.
   * @param options FaviconGenerationOptions including source path, output directory, and public path.
   * @returns An array of icon objects suitable for the web manifest and an array of generated HTML link tags.
   */
  async generateFavicons(options: FaviconGenerationOptions): Promise<{
    manifestIcons: ManifestIcon[];
    htmlLinkTags: HtmlLinkTag[];
    generatedImageDetails: GeneratedIcon[];
  }> {
    const {
      sourceImagePath,
      outputDirectory,
      publicPath,
      sizes = this.DEFAULT_ICON_SIZES,
    } = options;

    if (!fs.existsSync(sourceImagePath)) {
      throw new NotFoundException(`Source image not found: ${sourceImagePath}`);
    }

    await fs.ensureDir(outputDirectory); // Ensure the output directory exists

    const manifestIcons: ManifestIcon[] = [];
    const htmlLinkTags: HtmlLinkTag[] = [];
    const generatedImageDetails: GeneratedIcon[] = [];

    const format =
      path.extname(sourceImagePath).toLowerCase() === '.png' ? 'png' : 'png'; // Force PNG for favicons

    try {
      for (const size of sizes.sort((a, b) => a - b)) {
        const fileName = `icon-${size}x${size}.${format}`;
        const outputPath = path.join(outputDirectory, fileName);
        const publicUrl = `${publicPath}/${fileName}`;

        await sharp(sourceImagePath).resize(size, size).toFile(outputPath);

        this.logger.log(`Generated icon: ${outputPath} (${size}x${size})`);

        manifestIcons.push({
          src: publicUrl,
          sizes: `${size}x${size}`,
          type: `image/${format}`,
        });

        generatedImageDetails.push({
          src: publicUrl,
          size: size,
          type: `image/${format}`,
        });

        // Add specific HTML link tags for widely used sizes
        if (size === 16 || size === 32) {
          htmlLinkTags.push({
            rel: 'icon',
            type: `image/${format}`,
            sizes: `${size}x${size}`,
            href: publicUrl,
          });
        }
        if (size === 180) {
          // Standard Apple Touch Icon size
          htmlLinkTags.push({
            rel: 'apple-touch-icon',
            sizes: `${size}x${size}`,
            href: publicUrl,
          });
        }
      }

      // Add general favicon.ico (optional, but good for older browsers)
      // Note: .ico typically requires specific libraries or multiple PNGs packed into one.
      // For simplicity, we'll generate a 32x32 PNG renamed to .ico, though it's not a true multi-res .ico.
      // For a proper .ico, consider dedicated libraries or online generators.
      const faviconIcoPath = path.join(outputDirectory, 'favicon.ico');
      const faviconIcoPublicUrl = `${publicPath}/favicon.ico`;
      await sharp(sourceImagePath).resize(32, 32).toFile(faviconIcoPath);
      htmlLinkTags.push({
        rel: 'shortcut icon',
        type: 'image/x-icon',
        href: faviconIcoPublicUrl,
      });

      // Add a link for the web manifest
      htmlLinkTags.push({
        rel: 'manifest',
        href: `${publicPath}/manifest.json`, // Assuming manifest.json is also in the publicPath
      });

      // Add Safari Pinned Tab Icon (SVG recommended, but PNG can be used)
      // This is usually a monochromatic SVG. If you provide a separate SVG source, you can use that here.
      // For this example, we'll assume the primary icon serves this purpose.
      // If you have a separate black SVG for this purpose:
      // htmlLinkTags.push({
      //   rel: 'mask-icon',
      //   href: '/path/to/safari-pinned-tab.svg',
      //   color: '#5bbad5', // Example color
      // });

      return { manifestIcons, htmlLinkTags, generatedImageDetails };
    } catch (error) {
      this.logger.error('Error generating favicons:', error.stack);
      throw new InternalServerErrorException('Failed to generate favicons.');
    }
  }

  /**
   * Generates the web manifest JSON object.
   * @param options WebManifestOptions for the manifest content.
   * @returns The Web Manifest JSON object.
   */
  generateWebManifest(options: WebManifestOptions): WebManifestOptions {
    // You can add default values or validation here if needed
    return options;
  }

  /**
   * Helper to convert an array of HTML link tag objects into a string of HTML tags.
   * @param tags An array of HtmlLinkTag objects.
   * @returns A string of HTML <link> tags.
   */
  generateHtmlLinkTags(tags: HtmlLinkTag[]): string {
    return tags
      .map((tag) => {
        let attributes = '';
        for (const key in tag) {
          if (Object.prototype.hasOwnProperty.call(tag, key)) {
            attributes += ` ${key}="${tag[key]}"`;
          }
        }
        return `<link${attributes}>`;
      })
      .join('\n');
  }
}
