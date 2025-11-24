// FIlePath: src/executor/executor.service.ts
// Title: ExecutorService - snapshot and apply AI plan changes (with robust patch fallback and safe path resolution)
// Reason: Improve safety, correctness, and observability when applying AI-generated file diffs and content.

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

export function resolveChangePath(
  effectiveRepoPath: string,
  changeFilePath: string,
): string {
  const repo = path.resolve(effectiveRepoPath || process.cwd());

  // If no file path provided, return repo root
  if (!changeFilePath) return repo;

  // Normalize input
  const input = changeFilePath.trim();

  // If absolute path, try to make it repo-relative if it's inside the repo;
  // otherwise, strip root to create a pseudo-relative path that preserves tree structure.
  let normalized: string;
  if (path.isAbsolute(input)) {
    const abs = path.resolve(input);
    const repoWithSep = repo.endsWith(path.sep) ? repo : repo + path.sep;
    if (abs === repo || abs.startsWith(repoWithSep)) {
      normalized = path.relative(repo, abs); // repo-relative
    } else {
      // Turn absolute path like /etc/foo into etc/foo (strip root)
      normalized = path.relative(path.parse(abs).root, abs);
    }
  } else {
    normalized = input;
  }

  // Remove leading slashes/backslashes that may remain and normalize
  normalized = normalized.replace(/^[/\\]+/, '');
  const finalPath = path.normalize(path.join(repo, normalized));

  // Security: ensure finalPath is inside repo; if not, fallback to repo/basename(normalized)
  const finalWithSep = repo.endsWith(path.sep) ? repo : repo + path.sep;
  if (finalPath === repo || finalPath.startsWith(finalWithSep)) {
    return finalPath;
  }

  return path.join(repo, path.basename(normalized));
}

type SnapshotApplyResult = {
  ok: boolean;
  results: Array<Record<string, any>>;
  snapshot?: string | null;
  newHead?: string | null;
  error?: string;
  details?: string;
};

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

  /**
   * Snapshot, apply changes, run checks, commit, and return structured result.
   */
  async snapshotAndApply(
    planTitle: string,
    changes: FileChangeDto[],
    projectRoot?: string,
  ): Promise<SnapshotApplyResult> {
    const effectiveRepoPath = projectRoot
      ? path.resolve(projectRoot)
      : this.repoPath;
    const branch = `ai/plan-${Date.now()}`;
    const results: SnapshotApplyResult['results'] = [];

    // Preflight: ensure repo accessible
    try {
      await this.gitService.getStatus(effectiveRepoPath);
    } catch (e: any) {
      const message = String(e?.message ?? e);
      if (message.includes('not a Git repository')) {
        return {
          ok: false,
          error: `Project root '${effectiveRepoPath}' is not a Git repository. Cannot apply changes.`,
          results,
        };
      }
      return {
        ok: false,
        error: `Failed pre-check for Git repository: ${message}`,
        results,
      };
    }

    // Create or checkout branch
    try {
      await this.gitService.createBranch(branch, effectiveRepoPath);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.includes('already exists')) {
        try {
          await this.gitService.checkoutBranch(
            branch,
            false,
            effectiveRepoPath,
          );
        } catch (checkoutErr: any) {
          return {
            ok: false,
            error: `Failed to create or checkout branch ${branch}: ${String(checkoutErr?.message ?? checkoutErr)}`,
            results,
          };
        }
      } else {
        return {
          ok: false,
          error: `Failed to create branch ${branch}: ${msg}`,
          results,
        };
      }
    }

    // Snapshot: stage + commit a minimal snapshot to enable rollback
    try {
      await this.gitService.stageFiles(['.'], effectiveRepoPath);
      await this.gitService
        .commit(
          `snapshot before applying AI plan: ${planTitle}`,
          effectiveRepoPath,
        )
        .catch(() => {});
    } catch (e: any) {
      this.logger.warn(
        'Snapshot commit step failed (continuing):',
        String(e?.message ?? e),
      );
    }

    let snapshot: string | null = null;
    try {
      snapshot = await this.gitService.getHeadCommitHash(effectiveRepoPath);
    } catch (e: any) {
      this.logger.warn(
        'Failed to read HEAD commit hash after snapshot:',
        String(e?.message ?? e),
      );
    }

    // small utility helpers
    const ensureDirFor = async (filePath: string) =>
      fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    const writeTempPatch = async (content: string | undefined) => {
      const tempPatchName = `.temp-ai-patch-${Date.now()}.patch`;
      const tempPatchPath = path.join(effectiveRepoPath, tempPatchName);
      try {
        await fs.promises.writeFile(tempPatchPath, content ?? '', 'utf-8');
        return tempPatchPath;
      } catch (werr: any) {
        this.logger.warn(
          `Failed to write temp patch file ${tempPatchPath}: ${String(werr?.message ?? werr)}`,
        );
        return null;
      }
    };

    try {
      for (const ch of changes || []) {
        // Safely map action label (fall back to string)
        const actionLabel = (
          FileActionLabel[ch.action as PrismaFileAction] ??
          String(ch.action ?? 'unknown')
        ).toLowerCase();
        const abs = resolveChangePath(effectiveRepoPath, ch.filePath ?? '');

        this.logger.log(
          `Applying action=${actionLabel} file=${ch.filePath} -> abs=${abs}`,
        );

        // Handle create/modify/repair
        if (
          actionLabel === 'add' ||
          actionLabel === 'modify' ||
          actionLabel === 'repair'
        ) {
          await ensureDirFor(abs);

          // Prefer applying diff if provided; otherwise write newContent
          if (ch.diff) {
            // Try gitService.applyPatch first
            try {
              await this.gitService.applyPatch(ch.diff, effectiveRepoPath);
              // Verify & possibly overwrite with provided newContent
              if (ch.newContent != null) {
                try {
                  const current = await fs.promises.readFile(abs, 'utf-8');
                  if (current !== ch.newContent) {
                    this.logger.warn(
                      `Applied diff for ${ch.filePath} but content differs from provided newContent; overwriting to guarantee correctness.`,
                    );
                    await fs.promises.writeFile(abs, ch.newContent, 'utf-8');
                    results.push({
                      file: ch.filePath,
                      ok: true,
                      applied: 'diff+overwrite',
                    });
                    continue;
                  }
                } catch {
                  // If reading fails, attempt to write provided content
                  if (ch.newContent != null) {
                    await fs.promises.writeFile(abs, ch.newContent, 'utf-8');
                    results.push({
                      file: ch.filePath,
                      ok: true,
                      applied: 'diff+overwrite-on-read-fail',
                    });
                    continue;
                  }
                }
              }
              // Diff applied and verified or nothing to verify
              results.push({ file: ch.filePath, ok: true, applied: 'diff' });
              continue;
            } catch (applyErr: any) {
              this.logger.warn(
                `gitService.applyPatch failed for ${ch.filePath}: ${String(applyErr?.message ?? applyErr)}`,
              );
              // Fallbacks below
              const tempPatchPath = await writeTempPatch(ch.diff);
              let fallbackApplied = false;
              let appliedMethod = `diff-failed:${String(applyErr?.message ?? applyErr)}`;

              // Try git apply -p0..3
              if (tempPatchPath) {
                for (let strip = 0; strip <= 3 && !fallbackApplied; strip++) {
                  try {
                    await exec(
                      `git apply -p${strip} --reject --whitespace=fix "${tempPatchPath}"`,
                      {
                        cwd: effectiveRepoPath,
                        timeout: 1000 * 60 * 2,
                      },
                    );
                    fallbackApplied = true;
                    appliedMethod = `diff+gitapply-p${strip}`;
                    this.logger.log(
                      `Fallback git apply succeeded with -p${strip} for ${ch.filePath}`,
                    );
                  } catch (gerr: any) {
                    this.logger.debug(
                      `git apply -p${strip} failed: ${String(gerr?.message ?? gerr)}`,
                    );
                  }
                }
              }

              // Try system patch if git apply didn't succeed
              if (!fallbackApplied && tempPatchPath) {
                for (let strip = 0; strip <= 3 && !fallbackApplied; strip++) {
                  try {
                    await exec(`patch -p${strip} < "${tempPatchPath}"`, {
                      cwd: effectiveRepoPath,
                      timeout: 1000 * 60 * 2,
                    });
                    fallbackApplied = true;
                    appliedMethod = `diff+patch-p${strip}`;
                    this.logger.log(
                      `Fallback 'patch' succeeded with -p${strip} for ${ch.filePath}`,
                    );
                  } catch (perr: any) {
                    this.logger.debug(
                      `patch -p${strip} failed: ${String(perr?.message ?? perr)}`,
                    );
                  }
                }
              }

              // If any fallback applied, verify/overwrite with newContent if needed
              if (fallbackApplied) {
                if (ch.newContent != null) {
                  try {
                    const current = await fs.promises.readFile(abs, 'utf-8');
                    if (current !== ch.newContent) {
                      this.logger.warn(
                        `Fallback apply produced content differing from provided newContent for ${ch.filePath} — overwriting to ensure correctness.`,
                      );
                      await fs.promises.writeFile(abs, ch.newContent, 'utf-8');
                      appliedMethod += '+overwrite';
                    }
                  } catch (verr: any) {
                    this.logger.warn(
                      `Failed to verify/overwrite after fallback apply for ${ch.filePath}: ${String(verr?.message ?? verr)}`,
                    );
                  }
                }
                results.push({
                  file: ch.filePath,
                  ok: true,
                  applied: appliedMethod,
                  tempPatch: tempPatchPath,
                });
                continue;
              }

              // All diff methods failed -> fallthrough to write newContent if present
              if (!fallbackApplied && ch.newContent != null) {
                try {
                  await fs.promises.writeFile(abs, ch.newContent, 'utf-8');
                  results.push({
                    file: ch.filePath,
                    ok: true,
                    applied: 'write-newContent-after-diff-fail',
                    tempPatch: tempPatchPath,
                  });
                } catch (we: any) {
                  results.push({
                    file: ch.filePath,
                    ok: false,
                    error: `Failed to write newContent after diff failure: ${String(we?.message ?? we)}`,
                    tempPatch: tempPatchPath,
                  });
                }
                continue;
              }

              // Nothing left to try for this change
              results.push({
                file: ch.filePath,
                ok: false,
                error: `Failed to apply diff: ${String(applyErr?.message ?? applyErr)}`,
                tempPatch: tempPatchPath,
              });
              continue;
            } // end diff apply catch
          } // end if ch.diff

          // If no diff or diff process didn't finish it, fall back to writing newContent
          if (ch.newContent != null) {
            try {
              await fs.promises.writeFile(abs, ch.newContent, 'utf-8');
              results.push({
                file: ch.filePath,
                ok: true,
                applied: 'write-newContent',
              });
            } catch (e: any) {
              results.push({
                file: ch.filePath,
                ok: false,
                error: String(e?.message ?? e),
              });
            }
            continue;
          }

          // If neither diff nor newContent provided, attempt a best-effort access check
          try {
            await fs.promises.access(abs, fs.constants.R_OK);
            results.push({
              file: ch.filePath,
              ok: true,
              applied: 'no-op-access-check',
            });
          } catch {
            results.push({
              file: ch.filePath,
              ok: false,
              error: 'No diff or newContent; file missing or no-op',
            });
          }
          continue;
        } // end add/modify/repair

        // DELETE
        if (actionLabel === 'delete') {
          try {
            if (fs.existsSync(abs)) {
              await fs.promises.unlink(abs);
              results.push({ file: ch.filePath, ok: true, deleted: true });
            } else {
              results.push({
                file: ch.filePath,
                ok: false,
                error: 'file not found',
              });
            }
          } catch (e: any) {
            results.push({
              file: ch.filePath,
              ok: false,
              error: String(e?.message ?? e),
            });
          }
          continue;
        }

        // INSTALL / RUN (treat newContent as command)
        if (actionLabel === 'install' || actionLabel === 'run') {
          if (
            ch.newContent &&
            typeof ch.newContent === 'string' &&
            ch.newContent.trim()
          ) {
            try {
              const { stdout, stderr } = await exec(ch.newContent, {
                cwd: effectiveRepoPath,
                timeout: 1000 * 60 * 10,
              });
              results.push({
                file: ch.filePath ?? null,
                action: actionLabel,
                ok: true,
                stdout: String(stdout ?? ''),
                stderr: String(stderr ?? ''),
              });
            } catch (e: any) {
              results.push({
                file: ch.filePath ?? null,
                action: actionLabel,
                ok: false,
                error: String(e?.message ?? e),
              });
            }
          } else {
            results.push({
              file: ch.filePath ?? null,
              action: actionLabel,
              ok: false,
              error: 'No command provided for install/run action.',
            });
          }
          continue;
        }

        // Unknown action
        results.push({
          file: ch.filePath,
          ok: false,
          error: `Unknown action '${String(ch.action)}'`,
        });
      } // end for changes

      // Run TypeScript check if tsconfig exists
      const tsconfig = path.join(effectiveRepoPath, 'tsconfig.json');
      this.logger.debug(`projectRoot: ${projectRoot}`);
      this.logger.debug(`effectiveRepoPath: ${effectiveRepoPath}`);
      this.logger.debug(`tsconfig: ${tsconfig}`);

      if (fs.existsSync(tsconfig)) {
        try {
          await exec('npx tsc --noEmit', { cwd: effectiveRepoPath });
        } catch (e: any) {
          // rollback to snapshot on tsc failure
          this.logger.warn(
            'TypeScript check failed; attempting rollback to snapshot.',
          );
          if (snapshot) {
            try {
              await this.gitService.resetHard(snapshot, effectiveRepoPath);
            } catch (rerr: any) {
              this.logger.error(
                `Rollback failed after tsc error: ${String(rerr?.message ?? rerr)}`,
              );
            }
          }
          return {
            ok: false,
            error: 'TypeScript check failed',
            details: String(e?.message ?? e),
            results,
            snapshot,
          };
        }
      }

      // Linting: best-effort
      try {
        const pkgPath = path.join(effectiveRepoPath, 'package.json');
        if (fs.existsSync(pkgPath)) {
          const pkg = JSON.parse(await fs.promises.readFile(pkgPath, 'utf-8'));
          if (pkg?.scripts?.lint) {
            await exec('npm run lint', { cwd: effectiveRepoPath });
          } else if (
            fs.existsSync(
              path.join(effectiveRepoPath, 'node_modules', '.bin', 'eslint'),
            )
          ) {
            await exec('npx eslint .', { cwd: effectiveRepoPath });
          }
        }
      } catch (e: any) {
        // Non-fatal; record result
        results.push({ lint: 'failed', error: String(e?.message ?? e) });
      }

      // Stage and commit
      try {
        await this.gitService.stageFiles(['.'], effectiveRepoPath);
        await this.gitService
          .commit(`Apply AI plan ${planTitle}`, effectiveRepoPath)
          .catch(() => {});
      } catch (e: any) {
        this.logger.warn(
          'Commit after applying changes failed (continuing):',
          String(e?.message ?? e),
        );
      }

      let newHead: string | null = null;
      try {
        newHead = await this.gitService.getHeadCommitHash(effectiveRepoPath);
      } catch (e: any) {
        this.logger.warn(
          'Failed to read new HEAD commit hash:',
          String(e?.message ?? e),
        );
      }

      return { ok: true, results, snapshot, newHead };
    } catch (err: any) {
      // Attempt rollback and return error
      this.logger.error(
        'Unhandled error during snapshotAndApply:',
        String(err?.message ?? err),
      );
      if (snapshot) {
        try {
          await this.gitService.resetHard(snapshot, effectiveRepoPath);
        } catch (rollbackErr: any) {
          this.logger.error(
            `Failed to rollback to snapshot: ${String(rollbackErr?.message ?? rollbackErr)}`,
          );
        }
      }
      return {
        ok: false,
        error: String(err?.message ?? err),
        snapshot,
        results,
      };
    }
  }
}
