import { execSync } from 'child_process';

export function exec(cmd: string, options?: { stdio?: 'inherit' | 'pipe' }): string {
  try {
    return execSync(cmd, {
      encoding: 'utf-8',
      stdio: options?.stdio ?? 'pipe',
    }).trim();
  } catch {
    return '';
  }
}

export function cmdExists(cmd: string): boolean {
  try {
    execSync(`which ${cmd}`, { encoding: 'utf-8', stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function fileExists(path: string): boolean {
  try {
    execSync(`test -f ${path}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }

}
export function dirExists(path: string): boolean {
  try {
    execSync(`test -d ${path}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}
