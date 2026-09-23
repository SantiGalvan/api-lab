import { getEnvironment } from '../config.js';
import { makeMytaskApi } from '../api.js';
import { mapLimitSettled } from '../../../core/concurrency/index.js';
import { saveReport } from '../../../core/report/index.js';

const SEED_COUNT = 20;
const CONCURRENCY = 8;

/**
 * MyTask's Task Show/Create/Update responses may nest the Task under a
 * `task` key (mirroring the `{ task: ... }` request envelope) or return it
 * bare; normalize to the bare shape so the rest of the scenario doesn't care.
 */
const unwrapTask = (response) => response?.task ?? response;

const settledCounts = (results) => {
  const ok = results.filter((result) => result.status === 'fulfilled').length;
  return { ok, failed: results.length - ok, total: results.length };
};

const buildSeedPayload = (env, index) => ({
  name: `seed-and-verify-task #${index + 1}`,
  description: 'Created by the seedAndVerifyTask scenario',
  progress: 0,
  project_id: env.fixtureProjectId,
  ...(env.fixtureUserId ? { user_id: env.fixtureUserId } : {}),
  ...(env.fixtureTaskTypeId ? { task_type_id: env.fixtureTaskTypeId } : {}),
});

const runStatefulUpdateCheck = async (api, task) => {
  if (!task) {
    return { ok: false, reason: 'no Task was created to run the stateful update check on' };
  }

  try {
    const updatedName = `${task.name} (updated)`;
    await api.updateTask(task.id, { ...task, name: updatedName });
    const reread = unwrapTask(await api.getTask(task.id));
    return { ok: reread.name === updatedName, taskId: task.id };
  } catch (error) {
    return { ok: false, taskId: task.id, error: error.message };
  }
};

/**
 * Seeds 20 Tasks concurrently under a fixture Project, reads them all back
 * to confirm they exist, exercises a stateful update on one of them, cleans
 * every seeded Task up, and saves a report with real ok/failed counts.
 * Stays in `m2m` auth mode — it never calls `login()`.
 * @param {{ envName?: string, projectId?: string, reportDir?: string }} [options]
 * @returns {Promise<{ report: object, filepath: string }>}
 */
export const run = async ({ envName = 'production', projectId, reportDir } = {}) => {
  const baseEnv = getEnvironment(envName);
  const fixtureProjectId = projectId ?? baseEnv.fixtureProjectId;
  if (!fixtureProjectId) {
    throw new Error(
      'mytask seedAndVerifyTask: missing fixture project id (set MYTASK_FIXTURE_PROJECT_ID or pass { projectId })',
    );
  }
  const env = { ...baseEnv, fixtureProjectId };

  const api = makeMytaskApi(env);
  const startedAt = Date.now();

  const seedResults = await mapLimitSettled(
    Array.from({ length: SEED_COUNT }, (_, index) => index),
    (index) => api.createTask(buildSeedPayload(env, index)).then(unwrapTask),
    { concurrency: CONCURRENCY },
  );
  const created = seedResults.filter((result) => result.status === 'fulfilled').map((result) => result.value);

  const readBackResults = await mapLimitSettled(
    created,
    (task) => api.getTask(task.id).then(unwrapTask),
    { concurrency: CONCURRENCY },
  );

  const statefulUpdate = await runStatefulUpdateCheck(api, created[0]);

  const cleanupResults = await mapLimitSettled(
    created,
    (task) => api.deleteTask(task.id),
    { concurrency: CONCURRENCY },
  );

  const report = {
    scenario: 'seedAndVerifyTask',
    app: 'mytask',
    environment: envName,
    durationMs: Date.now() - startedAt,
    steps: {
      seed: settledCounts(seedResults),
      readBack: settledCounts(readBackResults),
      statefulUpdate,
      cleanup: settledCounts(cleanupResults),
    },
  };

  const filepath = await saveReport('mytask-seed-and-verify-task', report, reportDir ? { dir: reportDir } : undefined);

  return { report, filepath };
};

export default run;
