import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { FileChangeDto } from './types';

@Injectable()
export class ExecutorService {
  async apply(changes: FileChangeDto[]) {
    const results = [];
    for (const ch of changes) {
      const abs = path.join(process.cwd(), ch.filePath);
      if (ch.action === 'add' || ch.action === 'modify') {
        await fs.promises.mkdir(path.dirname(abs), { recursive: true });
        await fs.promises.writeFile(abs, ch.newContent || '', 'utf-8');
        results.push({ file: ch.filePath, ok: true });
      } else if (ch.action === 'delete') {
        try {
          await fs.promises.unlink(abs);
          results.push({ file: ch.filePath, ok: true, deleted: true });
        } catch (e) {
          results.push({ file: ch.filePath, ok: false, error: String(e) });
        }
      } else {
        results.push({ file: ch.filePath, ok: false, error: 'unknown action' });
      }
    }
    return results;
  }
}
