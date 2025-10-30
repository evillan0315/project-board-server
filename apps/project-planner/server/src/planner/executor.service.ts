import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';
import { exec as _exec } from 'child_process';

import { FileChangeDto } from './dto';
import { FileAction as PrismaFileAction } from '../prisma/prisma.service';
import { GitUtilService } from '../git/git.util';
import { CustomError } from '../common/errors';
import { ConfigService } from '../config';

const exec = promisify(_exec);

export class ExecutorService {
  private readonly repoPath: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly gitUtilService: GitUtilService,
  ) {
    this.repoPath = this.configService.get('BASE_DIR') || process.cwd();
  }

  async snapshotAndApply(planId: string, changes: FileChangeDto[]) {
    const branch = `ai/plan-${Date.now()}`;
    const effectiveRepoPath = path.resolve(this.repoPath);

    try {
      await this.gitUtilService.createBranch(branch, effectiveRepoPath);
    } catch (e: any) {
      if (e instanceof CustomError && e.message.includes('already exists')) {
        try {
          await this.gitUtilService.checkoutBranch(branch, false, effectiveRepoPath);
        } catch (checkoutError: any) {
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

    await this.gitUtilService.stageFiles(['.'], effectiveRepoPath);
    await this.gitUtilService.commit(`snapshot before ${planId}`, effectiveRepoPath).catch(() => {});
    const snapshot = await this.gitUtilService.getHeadCommitHash(effectiveRepoPath);

    const results: any[] = [];

    try {
      for (const ch of changes) {
        const action = ch.action.toLowerCase(); // Use lowercase string for comparison
        const abs = path.join(effectiveRepoPath, ch.filePath);

        if (action === 'add' || action === 'modify') {
          await fs.mkdir(path.dirname(abs), { recursive: true });

          if (ch.diff) {
            try {
              await this.gitUtilService.applyPatch(ch.diff, effectiveRepoPath);
              results.push({
                file: ch.filePath,
                ok: true,
                applied: 'diff',
              });
            } catch (e: any) {
              results.push({
                file: ch.filePath,
                ok: false,
                error: `Failed to apply diff: ${String(e)}`,
              });
            }
          } else {
            await fs.writeFile(abs, ch.newContent || '', 'utf-8');
            results.push({
              file: ch.filePath,
              ok: true,
              applied: action,
            });
          }
        } else if (action === 'delete') {
          try {
            await fs.unlink(abs);
            results.push({
              file: ch.filePath,
              ok: true,
              deleted: true,
            });
          } catch (e: any) {
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

      const tsconfig = path.join(effectiveRepoPath, 'tsconfig.json');
      if (await fs.access(tsconfig).then(() => true).catch(() => false)) {
        try {
          await exec('npx tsc --noEmit', { cwd: effectiveRepoPath });
        } catch (e: any) {
          await this.gitUtilService.resetHard(snapshot, effectiveRepoPath);
          return {
            ok: false,
            error: 'TypeScript check failed',
            details: String(e),
          };
        }
      }

      try {
        const packageJsonPath = path.join(effectiveRepoPath, 'package.json');
        const pkg = await fs.readFile(packageJsonPath, 'utf-8').then(JSON.parse).catch(() => ({ scripts: {} }));
        
        if (pkg.scripts && pkg.scripts.lint) {
          await exec('npm run lint', { cwd: effectiveRepoPath });
        } else if (
          await fs.access(path.join(effectiveRepoPath, 'node_modules', '.bin', 'eslint')).then(() => true).catch(() => false)
        ) {
          await exec('npx eslint .', { cwd: effectiveRepoPath });
        }
      } catch (e: any) {
        results.push({ lint: 'failed', error: String(e) });
      }

      await this.gitUtilService.stageFiles(['.'], effectiveRepoPath);
      await this.gitUtilService.commit(`Apply AI plan ${planId}`, effectiveRepoPath).catch(() => {});
      const newHead = await this.gitUtilService.getHeadCommitHash(effectiveRepoPath);

      return { ok: true, results, snapshot, newHead };
    } catch (err: any) {
      try {
        await this.gitUtilService.resetHard(snapshot, effectiveRepoPath);
      } catch (rollbackErr: any) {
        console.error(`Failed to rollback to snapshot: ${rollbackErr.message}`);
      }
      return { ok: false, error: String(err), snapshot };
    }
  }
}
