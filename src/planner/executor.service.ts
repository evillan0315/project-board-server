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

/**
 * Normalizes the change file path and guarantees that it is always
 * resolved under the repository path (no duplicated prefix, no accidental absolute escapes).
 */
export function resolveChangePath(
  effectiveRepoPath: string,
  changeFilePath: string,
): string {
  const repo = path.resolve(effectiveRepoPath || process.cwd());
  if (!changeFilePath) return repo;

  let normalized: string;

  // If absolute path, try to convert to a path relative to repo when possible.
  if (path.isAbsolute(changeFilePath)) {
    const abs = path.resolve(changeFilePath);

    // If abs is inside the repository (exact match or repo + separator), make it repo-relative.
    const repoWithSep = repo.endsWith(path.sep) ? repo : repo + path.sep;
    if (abs === repo || abs.startsWith(repoWithSep)) {
      normalized = path.relative(repo, abs);
    } else {
      // If outside repo, treat as pseudo-relative by stripping leading separator
      // (keeps files inside repo under a path that mirrors the absolute location).
      normalized = path.relative(path.parse(abs).root, abs); // strips the root (e.g. leading '/' or 'C:\')
    }
  } else {
    normalized = changeFilePath;
  }

  // Remove any accidental leading separators
  normalized = normalized.replace(/^[/\\]+/, '');

  // Build final path and normalize
  const finalPath = path.normalize(path.join(repo, normalized));

  // Safety: ensure finalPath is inside repo. If not, place file in repo root using basename.
  const finalWithSep = repo.endsWith(path.sep) ? repo : repo + path.sep;
  if (finalPath === repo || finalPath.startsWith(finalWithSep)) {
    return finalPath;
  }

  // Fallback: avoid writing outside repo by using repo + basename(normalized)
  return path.join(repo, path.basename(normalized));
}

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
   * Snapshot current HEAD (committing any staged/unstaged changes minimally),
   * create a branch for the plan application, apply every change using the best
   * available method (git patch via GitService or direct fs writes), run optional
   * checks (tsc, lint), then commit and return result summary including snapshot/newHead.
   */
  async snapshotAndApply(
    planTitle: string,
    changes: FileChangeDto[],
    projectRoot?: string,
  ) {
    const effectiveRepoPath = projectRoot
      ? path.resolve(projectRoot)
      : this.repoPath;
    const branch = `ai/plan-${Date.now()}`;

    // Preflight: ensure repo status accessible
    try {
      await this.gitService.getStatus(effectiveRepoPath);
    } catch (e: any) {
      if (
        e instanceof BadRequestException &&
        String(e.message).includes('not a Git repository')
      ) {
        return {
          ok: false,
          error: `Project root '${effectiveRepoPath}' is not a Git repository. Cannot apply changes.`,
        };
      }
      return {
        ok: false,
        error: `Failed pre-check for Git repository: ${String(e?.message ?? e)}`,
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
          };
        }
      } else {
        return {
          ok: false,
          error: `Failed to create branch ${branch}: ${msg}`,
        };
      }
    }

    // Make a minimal snapshot commit so we can rollback to a known commit
    try {
      // Stage everything to ensure reproducible snapshot; allow commit to fail (no changes)
      await this.gitService.stageFiles(['.'], effectiveRepoPath);
      await this.gitService
        .commit(
          `snapshot before applying AI plan: ${planTitle}`,
          effectiveRepoPath,
        )
        .catch(() => {});
    } catch (e: any) {
      // Not fatal — continue, but log
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

    const results: Array<any> = [];

    try {
      for (const ch of changes || []) {
        // Map Prisma enum (e.g. 'ADD') to lower-case label ('add') via map used in planner
        const actionLabel = FileActionLabel[ch.action as PrismaFileAction];
        const abs = path.join(effectiveRepoPath, ch.filePath);

        this.logger.log(
          `Applying action=${actionLabel} file=${ch.filePath} -> abs=${abs}`,
        );

        // Ensure directory exists for file operations (except delete or run)
        const ensureDirFor = (filePath: string) =>
          fs.promises.mkdir(path.dirname(filePath), { recursive: true });

        if (
          actionLabel === 'add' ||
          actionLabel === 'modify' ||
          actionLabel === 'repair'
        ) {
          await ensureDirFor(abs);
          if (ch.newContent) {
            // --- replace the inner try/catch around this.gitService.applyPatch(ch.diff, effectiveRepoPath)
            // with the code below -- keep surrounding context the same.

            try {
              let appliedMethod = 'new-content';


              // If newContent provided, verify; otherwise just try to read current file for sanity
              if (ch.newContent != null) {
                try {
                  const currentContent = await fs.promises.readFile(
                    abs,
                    'utf-8',
                  );
                  if (currentContent !== ch.newContent) {
                    this.logger.warn(
                      `Patch applied successfully to ${ch.filePath}, but resulting content differs from provided newContent (length: ${currentContent.length} vs ${ch.newContent.length}). Overwriting to ensure correctness.`,
                    );
                    await fs.promises.writeFile(abs, ch.newContent, 'utf-8');
                    appliedMethod = 'diff+overwrite';
                  }
                  
                } catch (readErr: any) {
                  this.logger.warn(
                    `Failed to verify content after patch for ${ch.filePath}: ${readErr.message}`,
                  );
                  this.logger.log(
                    `Adding ${ch.filePath}: ${ch.newContent}`,
                  );
                  await fs.promises.writeFile(abs, ch.newContent, 'utf-8');
                }
              } else {
                // Best-effort: try to read the file to ensure something changed / file exists
                try {
                  await fs.promises.access(abs, fs.constants.R_OK);
                } catch {
                  // not fatal — file may be newly created under a different path; keep going
                }
              }
              if (ch.diff) {
                // Primary: try the GitService helper (keeps existing behavior)
                await this.gitService.applyPatch(ch.diff, effectiveRepoPath);
                appliedMethod = 'diff';
              }

              results.push({
                file: ch.filePath,
                ok: true,
                applied: appliedMethod,
              });
            } catch (applyErr: any) {
              // Fallback strategy when applyPatch fails
              const tempPatchName = `.temp-ai-patch-${Date.now()}.patch`;
              const tempPatchPath = path.join(effectiveRepoPath, tempPatchName);

              try {
                // Persist the patch for debugging (consistent with existing behavior)
                await fs.promises.writeFile(
                  tempPatchPath,
                  ch.newContent,
                  'utf-8',
                );
                this.logger.warn(
                  `Primary patch apply failed; temp patch written to ${tempPatchPath}. Attempting fallback git/patch apply...`,
                );
              } catch (werr: any) {
                this.logger.warn(
                  `Failed to write temp patch file ${tempPatchPath}: ${String(werr?.message ?? werr)}`,
                );
              }

              let fallbackApplied = false;
              let appliedMethod = `diff-failed:${String(applyErr?.message ?? applyErr)}`;

              // Try git apply with different -p strip levels (0..3)
              for (let strip = 0; strip <= 3 && !fallbackApplied; strip++) {
                try {
                  this.logger.debug(
                    `Attempting git apply -p${strip} for ${tempPatchPath}`,
                  );
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
                  break;
                } catch (gerr: any) {
                  this.logger.debug(
                    `git apply -p${strip} failed: ${String(gerr?.message ?? gerr)}`,
                  );
                }
              }

              // If git apply didn't work, try system 'patch' (some environments have more tolerant 'patch' behavior)
              if (!fallbackApplied) {
                for (let strip = 0; strip <= 3 && !fallbackApplied; strip++) {
                  try {
                    this.logger.debug(
                      `Attempting system 'patch' -p${strip} for ${tempPatchPath}`,
                    );
                    // Use shell redirection to pipe the patch to patch command
                    await exec(`patch -p${strip} < "${tempPatchPath}"`, {
                      cwd: effectiveRepoPath,
                      timeout: 1000 * 60 * 2,
                    });
                    fallbackApplied = true;
                    appliedMethod = `diff+patch-p${strip}`;
                    this.logger.log(
                      `Fallback 'patch' succeeded with -p${strip} for ${ch.filePath}`,
                    );
                    break;
                  } catch (perr: any) {
                    this.logger.debug(
                      `patch -p${strip} failed: ${String(perr?.message ?? perr)}`,
                    );
                  }
                }
              }

              if (fallbackApplied) {
                // Attempt to verify if we can read the file; if newContent provided earlier we'd have overwritten.
                if (ch.newContent != null) {
                  try {
                    const currentContent = await fs.promises.readFile(
                      abs,
                      'utf-8',
                    );
                    if (currentContent !== ch.newContent) {
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
              } else {
                // No fallback succeeded — preserve the original apply error and the temp patch path
                results.push({
                  file: ch.filePath,
                  ok: false,
                  error: `Failed to apply diff: ${String(applyErr?.message ?? applyErr)}. Temp patch preserved at ${tempPatchPath}. See server logs for a preview and errors.`,
                  tempPatch: tempPatchPath,
                });
              }
            }
          } else {
            // No diff -> write newContent (possibly overwrite)
            try {
              await fs.promises.writeFile(abs, ch.newContent ?? '', 'utf-8');
              results.push({
                file: ch.filePath,
                ok: true,
                applied: actionLabel,
              });
            } catch (e: any) {
              results.push({
                file: ch.filePath,
                ok: false,
                error: String(e?.message ?? e),
              });
            }
          }
        } else if (actionLabel === 'delete') {
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
        } else if (actionLabel === 'install' || actionLabel === 'run') {
          // Treat newContent as shell command
          if (
            ch.newContent &&
            typeof ch.newContent === 'string' &&
            ch.newContent.trim().length > 0
          ) {
            try {
              const { stdout, stderr } = await exec(ch.newContent, {
                cwd: effectiveRepoPath,
                timeout: 1000 * 60 * 10,
              }); // 10m timeout
              results.push({
                file: ch.filePath ?? null,
                action: actionLabel,
                ok: true,
                stdout: stdout,
                stderr: stderr,
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
        } else {
          results.push({
            file: ch.filePath,
            ok: false,
            error: `Unknown action '${String(ch.action)}'`,
          });
        }
      } // end for changes

      // After applying file operations, run TypeScript check if applicable
      const tsconfig = path.join(effectiveRepoPath, 'tsconfig.json');

      this.logger.log(`projectRoot: ${projectRoot}`);
      this.logger.log(`effectiveRepoPath: ${effectiveRepoPath}`);
      this.logger.log(`tsconfig: ${tsconfig}`);
      if (fs.existsSync(tsconfig)) {
        try {
          await exec('npx tsc --noEmit ', { cwd: effectiveRepoPath });
        } catch (e: any) {
          // rollback on tsc failure
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

      // Linting: try package.json script then eslint
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
        // Non-fatal: report lint failure in results
        results.push({ lint: 'failed', error: String(e?.message ?? e) });
      }

      // Stage and commit changes from this branch
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
      // On any unexpected error, attempt rollback to snapshot
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
