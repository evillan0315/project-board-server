// FilePath: src/planner/executor.service.ts
// Title: Git-based executor that snapshots the repo and applies AI-generated file changes
// Reason: Safely apply file changes suggested by an AI plan while translating Prisma enums to
//         lowercase action labels using FileActionLabel mapping.

import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';
import { exec as _exec } from 'child_process';
import { promisify } from 'util';
import { FileChangeDto } from './dto';
import { FileAction as PrismaFileAction } from '@prisma/client';
import { FileActionLabel } from '@/common/constants/file-action-map';

const exec = promisify(_exec);

@Injectable()
export class ExecutorService {
  private repoPath = process.cwd(); // workspace root, adjust if needed

  async snapshotAndApply(planId: string, changes: FileChangeDto[]) {
    const git: SimpleGit = simpleGit(this.repoPath);
    const branch = `ai/plan-${Date.now()}`;
    await git.checkoutLocalBranch(branch);

    // snapshot current HEAD (commit any unstaged changes briefly to make a clean snapshot)
    await git.add('.');
    await git.commit(`snapshot before ${planId}`).catch(() => {});
    const snapshot = (await git.revparse(['HEAD'])).trim();

    const results: any[] = [];

    try {
      for (const ch of changes) {
        // Map Prisma enum (e.g. 'ADD') to lower-case string ('add')
        const action = FileActionLabel[ch.action as PrismaFileAction];
        const abs = path.join(this.repoPath, ch.filePath);

        if (action === 'add' || action === 'modify') {
          await fs.promises.mkdir(path.dirname(abs), { recursive: true });

          if ((ch as any).diff) {
            const diffPath = path.join(this.repoPath, `.ai-diff-${Date.now()}.patch`);
            await fs.promises.writeFile(diffPath, (ch as any).diff, 'utf-8');
            await exec(`git apply ${diffPath}`, { cwd: this.repoPath });
            await fs.promises.unlink(diffPath).catch(() => {});
            results.push({ file: ch.filePath, ok: true, applied: 'diff' });
          } else {
            await fs.promises.writeFile(abs, ch.newContent || '', 'utf-8');
            results.push({ file: ch.filePath, ok: true, applied: action });
          }
        } else if (action === 'delete') {
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

      // TypeScript check (if project is TS)
      const tsconfig = path.join(this.repoPath, 'tsconfig.json');
      if (fs.existsSync(tsconfig)) {
        try {
          await exec('npx tsc --noEmit', { cwd: this.repoPath });
        } catch (e) {
          // rollback on tsc failure
          await git.reset(['--hard', snapshot]);
          return { ok: false, error: 'TypeScript check failed', details: String(e) };
        }
      }

      // Lint (run npm run lint if provided; otherwise try eslint)
      try {
        const pkg = JSON.parse(
          await fs.promises.readFile(path.join(this.repoPath, 'package.json'), 'utf-8'),
        ).scripts || {};
        if (pkg.lint) {
          await exec('npm run lint', { cwd: this.repoPath });
        } else if (fs.existsSync(path.join(this.repoPath, 'node_modules', '.bin', 'eslint'))) {
          await exec('npx eslint .', { cwd: this.repoPath });
        }
      } catch (e) {
        // record lint failure — do not rollback automatically
        results.push({ lint: 'failed', error: String(e) });
      }

      // Commit changes
      await git.add('.');
      await git.commit(`Apply AI plan ${planId}`).catch(() => {});
      const newHead = (await git.revparse(['HEAD'])).trim();

      return { ok: true, results, snapshot, newHead };
    } catch (err) {
      // rollback to snapshot on any error
      try {
        await git.reset(['--hard', snapshot]);
      } catch {}
      return { ok: false, error: String(err), snapshot };
    }
  }
}

