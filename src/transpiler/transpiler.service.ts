import { Injectable } from '@nestjs/common';
import { build, transform } from 'esbuild';
import * as AdmZip from 'adm-zip';
import * as path from 'path';

import { TranspilerRequestDto } from './dto/transpiler-request.dto';
import { TranspilerOptionsDto } from './dto/transpiler-options.dto';

@Injectable()
export class TranspilerService {
  async transpile(request: TranspilerRequestDto): Promise<string> {
    const { code, options = {} } = request;
    const loader: TranspilerOptionsDto['loader'] = options.loader ?? 'tsx';
    const target: TranspilerOptionsDto['target'] = options.target ?? 'es2018';

    if (options.solid) {
      // Transpile with SolidJS JSX transform
      const result = await transform(code, {
        loader,
        target,
        jsxFactory: 'h',
        jsxFragment: 'Fragment',
        jsx: 'automatic',
        format: 'esm',
      });
      return result.code;
    }

    if (options.react) {
      // Transpile with React automatic runtime
      const result = await transform(code, {
        loader,
        target,
        jsx: 'automatic',
        format: 'esm',
      });
      return result.code;
    }

    // Generic TypeScript / JavaScript transpile
    const result = await transform(code, {
      loader,
      target,
      format: 'esm',
    });
    return result.code;
  }

  async transpileFullBuild(
    entryPoints: string[],
    outdir: string,
    options: TranspilerOptionsDto = {},
  ) {
    await build({
      entryPoints,
      outdir,
      bundle: true,
      minify: true,
      target: options.target ?? 'es2018',
      format: 'esm',
      jsx: options.react
        ? 'automatic'
        : options.solid
          ? 'automatic'
          : undefined,
      jsxFactory: options.solid ? 'h' : undefined,
      jsxFragment: options.solid ? 'Fragment' : undefined,
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
        '.jsx': 'jsx',
        '.js': 'js',
      },
      platform: 'browser',
    });
  }
  async transpileDirectoryArchive(zipBuffer: Buffer, options: any) {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();

    const results: { filename: string; code: string }[] = [];

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      const ext = path.extname(entry.entryName);
      if (!['.ts', '.tsx', '.jsx', '.js'].includes(ext)) continue;

      const sourceCode = entry.getData().toString('utf8');
      const transpiledCode = await this.transpile({
        code: sourceCode,
        options,
      });

      results.push({
        filename: entry.entryName,
        code: transpiledCode,
      });
    }

    return results;
  }
}
