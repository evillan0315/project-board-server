// src/manifest/interfaces/manifest-options.interface.ts

export interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: 'any' | 'maskable';
}

export interface WebManifestOptions {
  name: string;
  short_name: string;
  description?: string;
  start_url: string;
  display: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';
  background_color: string;
  theme_color: string;
  icons: ManifestIcon[];
  // You can add more manifest properties as needed, e.g., related_applications, shortcuts etc.
  // See: https://developer.mozilla.org/en-US/docs/Web/Manifest
}

export interface FaviconGenerationOptions {
  sourceImagePath: string; // Path to the original high-res image (e.g., SVG or large PNG)
  outputDirectory: string; // Directory where generated icons will be saved (e.g., './public/icons')
  publicPath: string; // Public URL path where icons will be accessible (e.g., '/icons')
  sizes?: number[]; // Optional: Custom sizes to generate. Default set will be used if not provided.
}

export interface GeneratedIcon {
  src: string;
  size: number;
  type: string;
}

export interface HtmlLinkTag {
  rel: string;
  href: string;
  sizes?: string;
  type?: string;
  color?: string; // For safari pinned tab icon
  name?: string; // For apple-touch-startup-image
}
