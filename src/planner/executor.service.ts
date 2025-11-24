// FIlePath: src/planner/executor.service.ts
// Title: ExecutorService - snapshot and apply AI plan changes
// Reason: Aligns with PlannerService and DTOs; supports full FileChangeDto fields, patch/apply, TS checks, linting, rollback.

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(ExecutorService.name);
  private readonly repoPath: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly gitService: GitService,
  ) {
    this.repoPath = this.configService.get<string>('BASE_DIR') || process.cwd();
  }

  async snapshotAndApply(planTitle: string, changes: FileChangeDto[], projectRoot?: string) {
    const effectiveRepoPath = projectRoot ? path.resolve(projectRoot) : this.repoPath;
    const branch = `ai/plan-${Date.now()}`;

    try {
      await this.gitService.getStatus(effectiveRepoPath);
    } catch (e) {
      return {
        ok: false,
        error: `Git pre-check failed: ${e instanceof Error ? e.message : String(e)}`,
      };
    }

    try {
      await this.gitService.createBranch(branch, effectiveRepoPath);
    } catch (e: any) {
      if (e instanceof BadRequestException && e.message.includes('already exists')) {
        try {
          await this.gitService.checkoutBranch(branch, false, effectiveRepoPath);
        } catch (checkoutError) {
          return { ok: false, error: `Cannot checkout branch ${branch}: ${checkoutError.message}` };
        }
      } else {
        return { ok: false, error: `Cannot create branch ${branch}: ${e.message}` };
      }
    }

    await this.gitService.stageFiles(['.'], effectiveRepoPath);
    await this.gitService.commit(`snapshot before applying AI plan: ${planTitle}`, effectiveRepoPath).catch(() => {});
    const snapshot = await this.gitService.getHeadCommitHash(effectiveRepoPath);

    const results: any[] = [];

    try {
      for (const ch of changes) {
        const action = FileActionLabel[ch.action as PrismaFileAction];
        const abs = path.join(effectiveRepoPath, ch.filePath);

        switch (action) {
          case 'add':
            await fs.promises.mkdir(path.dirname(abs), { recursive: true });
            if (ch.diff) {
              try {
                await this.gitService.applyPatch(ch.diff, effectiveRepoPath);
                results.push({ file: ch.filePath, ok: true, applied: 'diff' });
              } catch (err) {
                results.push({ file: ch.filePath, ok: false, error: `Failed to apply diff: ${err}` });
              }
            } else {
              await fs.promises.writeFile(abs, ch.newContent || '', 'utf-8');
              results.push({ file: ch.filePath, ok: true, applied: action });
            }
            break;
          case 'modify':
            await fs.promises.mkdir(path.dirname(abs), { recursive: true });
            if (ch.diff) {
              try {
                await this.gitService.applyPatch(ch.diff, effectiveRepoPath);
                results.push({ file: ch.filePath, ok: true, applied: 'diff' });
              } catch (err) {
                results.push({ file: ch.filePath, ok: false, error: `Failed to apply diff: ${err}` });
              }
            } else {
              await fs.promises.writeFile(abs, ch.newContent || '', 'utf-8');
              results.push({ file: ch.filePath, ok: true, applied: action });
            }
            break;
          case 'repair':
            await fs.promises.mkdir(path.dirname(abs), { recursive: true });
            if (ch.diff) {
              try {
                await this.gitService.applyPatch(ch.diff, effectiveRepoPath);
                results.push({ file: ch.filePath, ok: true, applied: 'diff' });
              } catch (err) {
                results.push({ file: ch.filePath, ok: false, error: `Failed to apply diff: ${err}` });
              }
            } else {
              await fs.promises.writeFile(abs, ch.newContent || '', 'utf-8');
              results.push({ file: ch.filePath, ok: true, applied: action });
            }
            break;

          case 'delete':
            try {
              await fs.promises.unlink(abs);
              results.push({ file: ch.filePath, ok: true, deleted: true });
            } catch (err) {
              results.push({ file: ch.filePath, ok: false, error: String(err) });
            }
            break;

          case 'install':
          case 'run':
            if (ch.newContent) {
              try {
                const { stdout, stderr } = await exec(ch.newContent, { cwd: effectiveRepoPath });
                results.push({ file: ch.filePath, action, ok: true, stdout, stderr });
              } catch (err) {
                results.push({ file: ch.filePath, action, ok: false, error: String(err) });
              }
            } else {
              results.push({ file: ch.filePath, action, ok: false, error: 'No command provided' });
            }
            break;

          default:
            results.push({ file: ch.filePath, ok: false, error: 'unknown action' });
        }
      }

      // TypeScript check
      const tsconfig = path.join(effectiveRepoPath, 'tsconfig.json');
      if (fs.existsSync(tsconfig)) {
        try {
          await exec('npx tsc --noEmit', { cwd: effectiveRepoPath });
        } catch (err) {
          await this.gitService.resetHard(snapshot, effectiveRepoPath);
          return { ok: false, error: 'TypeScript check failed', details: String(err), snapshot };
        }
      }

      // Lint
      try {
        const pkg = JSON.parse(await fs.promises.readFile(path.join(effectiveRepoPath, 'package.json'), 'utf-8')).scripts || {};
        if (pkg.lint) await exec('npm run lint', { cwd: effectiveRepoPath });
        else if (fs.existsSync(path.join(effectiveRepoPath, 'node_modules', '.bin', 'eslint')))
          await exec('npx eslint .', { cwd: effectiveRepoPath });
      } catch (err) {
        results.push({ lint: 'failed', error: String(err) });
      }

      await this.gitService.stageFiles(['.'], effectiveRepoPath);
      await this.gitService.commit(`Apply AI plan ${planTitle}`, effectiveRepoPath).catch(() => {});
      const newHead = await this.gitService.getHeadCommitHash(effectiveRepoPath);

      return { ok: true, results, snapshot, newHead };
    } catch (err) {
      try {
        await this.gitService.resetHard(snapshot, effectiveRepoPath);
      } catch (rollbackErr) {
        this.logger.error(`Failed rollback: ${rollbackErr.message}`);
      }
      return { ok: false, error: String(err), snapshot };
    }
  }
}

