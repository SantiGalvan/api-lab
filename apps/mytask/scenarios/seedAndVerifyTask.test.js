import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from './seedAndVerifyTask.js';

const BASE_URL = 'https://mytask.example.com/api/';

function urlPath(url) {
  return new URL(url).pathname.replace(/^\/api\//, '');
}

function makeTaskStore() {
  let nextId = 1;
  const tasks = new Map();
  return {
    create(fields) {
      const id = nextId++;
      const task = { id, ...fields };
      tasks.set(id, task);
      return task;
    },
    get(id) {
      return tasks.get(Number(id));
    },
    update(id, fields) {
      const task = { ...tasks.get(Number(id)), ...fields, id: Number(id) };
      tasks.set(Number(id), task);
      return task;
    },
    delete(id) {
      tasks.delete(Number(id));
    },
  };
}

describe('mytask seedAndVerifyTask scenario', () => {
  const originalEnv = { ...process.env };
  let reportDir;

  beforeEach(async () => {
    process.env.MYTASK_URI = BASE_URL;
    process.env.MYTASK_M2M_TOKEN = 'm2m-secret';
    process.env.MYTASK_FIXTURE_PROJECT_ID = '1';
    process.env.MYTASK_FIXTURE_USER_ID = '309';
    process.env.MYTASK_FIXTURE_TASK_TYPE_ID = '2';
    reportDir = await mkdtemp(join(tmpdir(), 'api-lab-seed-'));
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
    await rm(reportDir, { recursive: true, force: true });
  });

  it('throws when no fixture project id is configured or passed', async () => {
    delete process.env.MYTASK_FIXTURE_PROJECT_ID;

    await expect(run({ reportDir })).rejects.toThrow(/fixture project id/);
  });

  it('seeds, reads back, runs a stateful update, cleans up, and saves a real report', async () => {
    const store = makeTaskStore();
    let createInFlight = 0;
    let createPeak = 0;

    fetch.mockImplementation(async (url, opts) => {
      const path = urlPath(url);
      const { method } = opts;

      if (path === 'tasks' && method === 'POST') {
        createInFlight += 1;
        createPeak = Math.max(createPeak, createInFlight);
        await new Promise((resolve) => setTimeout(resolve, 5));
        createInFlight -= 1;

        const { task } = JSON.parse(opts.body);
        const created = store.create(task);
        return new Response(JSON.stringify({ task: created }), { status: 201 });
      }

      const match = path.match(/^tasks\/(\d+)$/);
      if (match && method === 'GET') {
        return new Response(JSON.stringify({ task: store.get(match[1]) }), { status: 200 });
      }
      if (match && method === 'PUT') {
        const { task } = JSON.parse(opts.body);
        return new Response(JSON.stringify({ task: store.update(match[1], task) }), { status: 200 });
      }
      if (match && method === 'DELETE') {
        store.delete(match[1]);
        return new Response(null, { status: 204 });
      }

      throw new Error(`unexpected request: ${method} ${url}`);
    });

    const { report, filepath } = await run({ reportDir });

    expect(report.environment).toBe('production');
    expect(report.steps.seed).toEqual({ ok: 20, failed: 0, total: 20 });
    expect(report.steps.readBack).toEqual({ ok: 20, failed: 0, total: 20 });
    expect(report.steps.cleanup).toEqual({ ok: 20, failed: 0, total: 20 });
    expect(report.steps.statefulUpdate.ok).toBe(true);
    expect(typeof report.durationMs).toBe('number');
    expect(createPeak).toBeLessThanOrEqual(8);
    expect(createPeak).toBeGreaterThan(1);

    const files = await readdir(reportDir);
    expect(files).toHaveLength(1);
    const saved = JSON.parse(await readFile(filepath, 'utf8'));
    expect(saved).toEqual(report);
  });

  it('counts failed creates and only operates on the tasks that were actually created', async () => {
    const store = makeTaskStore();

    fetch.mockImplementation(async (url, opts) => {
      const path = urlPath(url);
      const { method } = opts;

      if (path === 'tasks' && method === 'POST') {
        const { task } = JSON.parse(opts.body);
        if (task.name.endsWith('#5') || task.name.endsWith('#10')) {
          return new Response(JSON.stringify({ message: 'boom' }), { status: 500 });
        }
        const created = store.create(task);
        return new Response(JSON.stringify({ task: created }), { status: 201 });
      }

      const match = path.match(/^tasks\/(\d+)$/);
      if (match && method === 'GET') {
        return new Response(JSON.stringify({ task: store.get(match[1]) }), { status: 200 });
      }
      if (match && method === 'PUT') {
        const { task } = JSON.parse(opts.body);
        return new Response(JSON.stringify({ task: store.update(match[1], task) }), { status: 200 });
      }
      if (match && method === 'DELETE') {
        store.delete(match[1]);
        return new Response(null, { status: 204 });
      }

      throw new Error(`unexpected request: ${method} ${url}`);
    });

    const { report } = await run({ reportDir });

    expect(report.steps.seed).toEqual({ ok: 18, failed: 2, total: 20 });
    expect(report.steps.readBack).toEqual({ ok: 18, failed: 0, total: 18 });
    expect(report.steps.cleanup).toEqual({ ok: 18, failed: 0, total: 18 });
  });
});
