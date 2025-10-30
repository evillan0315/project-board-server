import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { exec as _exec } from 'child_process';
import { promisify } from 'util';
import { FileChangeDto } from './dto';
import { FileAction as PrismaFileAction } from '@prisma/client';
import { FileActionLabel } from '@/common/constants/file-action-map';
import { ConfigService } from '@nestjs/config';
import { GitService } from '@/git/git.service';
const exec = promisify(_exec);
@Injectable()
export class ExecutorService {
  private readonly repoPath: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly gitService: GitService,
  ) {
    this.repoPath =
      this.configService.get<string>('BASE_DIR') || process.cwd();
  }
  async snapshotAndApply(planId: string, changes: FileChangeDto[]) {
    const branch = `ai/plan-${Date.now()}`;
    const effectiveRepoPath = path.resolve(this.repoPath);
    try {
      await this.gitService.createBranch(branch, effectiveRepoPath);
    } catch (e) {
      if (e instanceof BadRequestException && e.message.includes('already exists')) {
        // If the branch already exists (e.g., from a previous failed run), try to checkout
        try {
          await this.gitService.checkoutBranch(branch, false, effectiveRepoPath);
        } catch (checkoutError) {
          return {
            ok: false,
            error: `Failed to create or checkout branch ${branch}: ${checkoutError.message}`,
          };
        }
      } else {
        return {
          ok: false,
          error: `Failed to create branch ${branch}: ${e.message}`,
        };
      }
    }
    // Snapshot current HEAD (commit any unstaged changes briefly to make a clean snapshot)
    await this.gitService.stageFiles(['.'], effectiveRepoPath);
    await this.gitService.commit(`snapshot before ${planId}`, effectiveRepoPath).catch(() => {});
    const snapshot = await this.gitService.getHeadCommitHash(effectiveRepoPath);
    const results: any[] = [];
    try {
      for (const ch of changes) {
        // Map Prisma enum (e.g. 'ADD') to lower-case string ('add')
        const action = FileActionLabel[ch.action as PrismaFileAction];
        const abs = path.join(effectiveRepoPath, ch.filePath);
        if (action === 'add' || action === 'modify') {
          await fs.promises.mkdir(path.dirname(abs), { recursive: true });
          if (ch.diff) {
            // Use GitService to apply the patch content
            try {
              await this.gitService.applyPatch(ch.diff, effectiveRepoPath);
              results.push({
                file: ch.filePath,
                ok: true,
                applied: 'diff',
              });
            } catch (e) {
              results.push({
                file: ch.filePath,
                ok: false,
                error: `Failed to apply diff: ${String(e)}`,
              });
            }
          } else {
            await fs.promises.writeFile(abs, ch.newContent || '', 'utf-8');
            results.push({
              file: ch.filePath,
              ok: true,
              applied: action,
            });
          }
        } else if (action === 'delete') {
          try {
            await fs.promises.unlink(abs);
            results.push({
              file: ch.filePath,
              ok: true,
              deleted: true,
            });
          } catch (e) {
            results.push({
              file: ch.filePath,
              ok: false,
              error: String(e),
            });
          }
        } else {
          results.push({
            file: ch.filePath,
            ok: false,
            error: 'unknown action',
          });
        }
      }
      // TypeScript check (if project is TS)
      const tsconfig = path.join(effectiveRepoPath, 'tsconfig.json');
      if (fs.existsSync(tsconfig)) {
        try {
          await exec('npx tsc --noEmit', { cwd: effectiveRepoPath });
        } catch (e) {
          // rollback on tsc failure
          await this.gitService.resetHard(snapshot, effectiveRepoPath);
          return {
            ok: false,
            error: 'TypeScript check failed',
            details: String(e),
          };
        }
      }
      // Lint (run npm run lint if provided; otherwise try eslint)
      try {
        const pkg =
          JSON.parse(
            await fs.promises.readFile(
              path.join(effectiveRepoPath, 'package.json'),
              'utf-8',
            ),
          ).scripts || {};
        if (pkg.lint) {
          await exec('npm run lint', { cwd: effectiveRepoPath });
        } else if (
          fs.existsSync(
            path.join(effectiveRepoPath, 'node_modules', '.bin', 'eslint'),
          )
        ) {
          await exec('npx eslint .', { cwd: effectiveRepoPath });
        }
      } catch (e) {
        // record lint failure — do not rollback automatically
        results.push({ lint: 'failed', error: String(e) });
      }
      // Commit changes
      await this.gitService.stageFiles(['.'], effectiveRepoPath);
      await this.gitService.commit(`Apply AI plan ${planId}`, effectiveRepoPath).catch(() => {});
      const newHead = await this.gitService.getHeadCommitHash(effectiveRepoPath);
      return { ok: true, results, snapshot, newHead };
    } catch (err) {
      // rollback to snapshot on any error
      try {
        await this.gitService.resetHard(snapshot, effectiveRepoPath);
      } catch (rollbackErr) {
        // Log if rollback itself fails
//         console.error(`Failed to rollback to snapshot: ${rollbackErr.message}`);
      }
      return { ok: false, error: String(err), snapshot };
    }
  }
}
