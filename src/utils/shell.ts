import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface ExecResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export function exec(cmd: string, options?: { stdio?: 'inherit' | 'pipe' }): string {
  const result = execResult(cmd, options);
  return result.ok ? result.stdout : '';
}

export function execResult(cmd: string, options?: { stdio?: 'inherit' | 'pipe' }): ExecResult {
  try {
    const stdout = execSync(cmd, {
      encoding: 'utf-8',
      stdio: options?.stdio ?? 'pipe',
    }).trim();
    return { ok: true, stdout, stderr: '', exitCode: 0 };
  } catch (error) {
    const execError = error as {
      status?: number;
      stdout?: Buffer | string;
      stderr?: Buffer | string;
    };
    return {
      ok: false,
      stdout: bufferToString(execError.stdout).trim(),
      stderr: bufferToString(execError.stderr).trim(),
      exitCode: typeof execError.status === 'number' ? execError.status : null,
    };
  }
}

function bufferToString(value: Buffer | string | undefined): string {
  if (!value) return '';
  return Buffer.isBuffer(value) ? value.toString('utf-8') : value;
}

export function cmdExists(cmd: string): boolean {
  if (!/^[A-Za-z0-9._-]+$/.test(cmd)) return false;

  const pathValue = process.env.PATH;
  if (!pathValue) return false;

  return pathValue.split(path.delimiter).some((dir) => {
    const candidate = path.join(dir, cmd);
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  });
}

export function fileExists(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

export function dirExists(dirPath: string): boolean {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}
