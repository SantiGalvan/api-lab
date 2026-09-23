import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { saveReport } from './report.js';

describe('saveReport', () => {
  let dir;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'api-lab-report-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('writes the given data as JSON under a timestamped filename', async () => {
    const filepath = await saveReport('login-flow', { ok: true, count: 3 }, { dir });

    const files = await readdir(dir);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/^.+-login-flow\.json$/);
    expect(filepath).toBe(join(dir, files[0]));

    const contents = JSON.parse(await readFile(filepath, 'utf8'));
    expect(contents).toEqual({ ok: true, count: 3 });
  });

  it('defaults to writing under a "runs" folder relative to the cwd', async () => {
    const originalCwd = process.cwd();
    process.chdir(dir);

    try {
      const filepath = await saveReport('login-flow', { ok: true });
      expect(filepath).toBe(join('runs', (await readdir(join(dir, 'runs')))[0]));
    } finally {
      process.chdir(originalCwd);
    }
  });
});
