import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EnvSetupService {
  private readonly envPath = path.resolve(process.cwd(), '.env');

  readEnvFile(): Record<string, string> {
    if (!fs.existsSync(this.envPath)) {
      return {};
    }

    const contents = fs.readFileSync(this.envPath, 'utf8');
    return Object.fromEntries(
      contents
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [key, ...rest] = line.split('=');
          let value = rest.join('=').trim();
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1).replace(/\\"/g, '"');
          }
          return [key, value];
        }),
    );
  }
  generateOrUpdateEnvFile(envValues: Record<string, any>): void {
    const lines: string[] = [];

    for (const [key, value] of Object.entries(envValues)) {
      const safeValue =
        typeof value === 'string' && /[\s'"\\]/.test(value)
          ? `"${value.replace(/"/g, '\\"')}"`
          : value;
      lines.push(`${key}=${safeValue}`);
    }

    fs.writeFileSync(this.envPath, lines.join('\n'), { encoding: 'utf8' });
  }
}
