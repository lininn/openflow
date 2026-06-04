import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cmdExists, dirExists, exec, execResult, fileExists } from './shell.js';

describe('shell utilities', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openflow-shell-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('fileExists returns true only for files', () => {
    const filePath = path.join(tmpDir, 'sample.txt');
    const dirPath = path.join(tmpDir, 'folder');

    fs.writeFileSync(filePath, 'content');
    fs.mkdirSync(dirPath);

    expect(fileExists(filePath)).toBe(true);
    expect(fileExists(dirPath)).toBe(false);
    expect(fileExists(path.join(tmpDir, 'missing.txt'))).toBe(false);
  });

  it('dirExists returns true only for directories', () => {
    const filePath = path.join(tmpDir, 'sample.txt');
    const dirPath = path.join(tmpDir, 'folder');

    fs.writeFileSync(filePath, 'content');
    fs.mkdirSync(dirPath);

    expect(dirExists(dirPath)).toBe(true);
    expect(dirExists(filePath)).toBe(false);
    expect(dirExists(path.join(tmpDir, 'missing'))).toBe(false);
  });

  it('treats paths with spaces and shell metacharacters literally', () => {
    const trickyFile = path.join(tmpDir, 'name with spaces; echo injected.txt');
    const trickyDir = path.join(tmpDir, 'folder with spaces; echo injected');

    fs.writeFileSync(trickyFile, 'content');
    fs.mkdirSync(trickyDir);

    expect(fileExists(trickyFile)).toBe(true);
    expect(dirExists(trickyDir)).toBe(true);
  });

  it('cmdExists detects commands without requiring shell syntax', () => {
    expect(cmdExists('node')).toBe(true);
    expect(cmdExists('definitely-not-openflow-command')).toBe(false);
    expect(cmdExists('node; echo injected')).toBe(false);
  });

  it('execResult distinguishes failed commands from successful empty stdout', () => {
    const emptySuccess = execResult('node -e ""');
    const failure = execResult('node -e "process.exit(7)"');

    expect(emptySuccess.ok).toBe(true);
    expect(emptySuccess.stdout).toBe('');
    expect(failure.ok).toBe(false);
    expect(failure.exitCode).toBe(7);
    expect(exec('node -e "process.exit(7)"')).toBe('');
  });
});
