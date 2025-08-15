// src/icon/icon.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import axios from 'axios';
import {
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  statSync,
  readFileSync,
} from 'fs';
import * as path from 'path';
import { optimize } from 'svgo';

export interface IconInfo {
  prefix: string;
  name: string;
  path: string;
}

@Injectable()
export class IconService {
  private readonly logger = new Logger(IconService.name);
  private readonly baseUrl = 'https://api.iconify.design';
  private readonly rootDir = path.resolve('icons');

  constructor() {
    if (!existsSync(this.rootDir)) {
      mkdirSync(this.rootDir, { recursive: true });
    }
  }

  private resolveIconPath(prefix: string, name: string): string {
    const dir = path.join(this.rootDir, prefix);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    return path.join(dir, `${name}.svg`);
  }

  private getIconUrl(iconName: string): string {
    return `${this.baseUrl}/${iconName.replace(':', '/')}.svg`;
  }

  async downloadAllFromPrefix(prefix: string) {
    const indexUrl = `${this.baseUrl}/collection?prefix=${prefix}&pretty=1`;

    const { data } = await axios.get(indexUrl);

    if (!data?.uncategorized || !Array.isArray(data.uncategorized)) {
      throw new Error(`Prefix "${prefix}" not found or has no icons`);
    }

    const iconNames = data.uncategorized.map(
      (name: string) => `${prefix}:${name}`,
    );

    return this.downloadIconsBatch(iconNames);
  }
  async downloadIcon(iconName: string): Promise<string> {
    const [prefix, name] = iconName.split(':');
    if (!prefix || !name) throw new Error(`Invalid icon name: ${iconName}`);

    const filePath = this.resolveIconPath(prefix, name);
    if (existsSync(filePath)) return filePath;

    const response = await axios.get(this.getIconUrl(iconName), {
      responseType: 'text',
    });
    if (!response.data.includes('<svg'))
      throw new Error(`Invalid SVG for ${iconName}`);

    const optimized = optimize(response.data, {
      multipass: true,
      plugins: ['removeDimensions', 'removeTitle', 'removeDesc'],
    });

    if ('data' in optimized) {
      writeFileSync(filePath, optimized.data, 'utf-8');
      return filePath;
    }

    throw new Error(`Optimization failed for ${iconName}`);
  }

  async downloadIconsBatch(
    iconNames: string[],
  ): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    await Promise.all(
      iconNames.map(async (name) => {
        try {
          await this.downloadIcon(name);
          success.push(name);
        } catch {
          failed.push(name);
        }
      }),
    );

    return { success, failed };
  }

  async listIcons(
    prefix?: string,
    sort: 'prefix' | 'name' = 'name',
    order: 'asc' | 'desc' = 'asc',
    page = 1,
    limit = 50,
  ): Promise<{ total: number; icons: IconInfo[] }> {
    const results: IconInfo[] = [];
    const baseDir = this.rootDir;

    const listDir = (dir: string, currentPrefix: string) => {
      const items = readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = statSync(fullPath);
        if (stats.isDirectory()) {
          listDir(fullPath, item); // recurse
        } else if (stats.isFile() && item.endsWith('.svg')) {
          const name = path.basename(item, '.svg');
          const relPath = path.relative(baseDir, fullPath);
          results.push({
            prefix: currentPrefix,
            name,
            path: `icons/${relPath}`,
          });
        }
      }
    };

    if (prefix) {
      const prefixDir = path.join(baseDir, prefix);
      if (existsSync(prefixDir)) listDir(prefixDir, prefix);
    } else {
      listDir(baseDir, '');
    }

    results.sort((a, b) => {
      const compareVal = a[sort].localeCompare(b[sort]);
      return order === 'asc' ? compareVal : -compareVal;
    });

    const start = (page - 1) * limit;
    const icons = results.slice(start, start + limit);

    return { total: results.length, icons };
  }

  getIconContent(prefix: string, name: string): string {
    const filePath = this.resolveIconPath(prefix, name);
    if (!existsSync(filePath))
      throw new NotFoundException(`Icon ${prefix}:${name} not found`);
    return readFileSync(filePath, 'utf-8');
  }
}
