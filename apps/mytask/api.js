import { get, post, put, del } from '../../core/client/index.js';
import { createStaticAuthStrategy } from '../../core/auth/index.js';

function buildUrl(baseUrl, path) {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return new URL(path, base).toString();
}

function createAuthStrategy(env, authMode) {
  if (authMode !== 'm2m') {
    throw new Error(`mytask: unsupported auth mode "${authMode}"`);
  }
  return createStaticAuthStrategy(env.token);
}

/**
 * Builds the MyTask domain API bound to a resolved environment (see config.js).
 * Every domain function goes through the shared engine's HTTP verbs and auth
 * strategy — never through `fetch` directly.
 * @param {{ baseUrl: string, token: object }} env - resolved MyTask environment.
 * @param {{ authMode?: 'm2m' }} [options] - `authMode` is `'m2m'` by default;
 *   MyTask's `login` mode (see ADR 0001) is not wired up for this app yet.
 * @returns {{ createTask: Function, getTask: Function, updateTask: Function, deleteTask: Function }}
 */
export function makeMytaskApi(env, { authMode = 'm2m' } = {}) {
  const strategy = createAuthStrategy(env, authMode);

  /**
   * Creates a new Task.
   * @param {object} payload - Task fields as expected by MyTask.
   * @returns {Promise<object>} the created Task.
   */
  function createTask(payload) {
    return strategy.request((token) => post(buildUrl(env.baseUrl, 'tasks'), payload, { token }));
  }

  /**
   * Retrieves a Task by id.
   * @param {string|number} id - Task id.
   * @returns {Promise<object>} the Task.
   */
  function getTask(id) {
    return strategy.request((token) => get(buildUrl(env.baseUrl, `tasks/${id}`), { token }));
  }

  /**
   * Replaces a Task by id (MyTask's Task Update is a full PUT, not a partial patch).
   * @param {string|number} id - Task id.
   * @param {object} payload - full Task representation to send.
   * @returns {Promise<object>} the updated Task.
   */
  function updateTask(id, payload) {
    return strategy.request((token) => put(buildUrl(env.baseUrl, `tasks/${id}`), payload, { token }));
  }

  /**
   * Deletes a Task by id.
   * @param {string|number} id - Task id.
   * @returns {Promise<object|undefined>} MyTask's response body, if any.
   */
  function deleteTask(id) {
    return strategy.request((token) => del(buildUrl(env.baseUrl, `tasks/${id}`), { token }));
  }

  return { createTask, getTask, updateTask, deleteTask };
}

export default makeMytaskApi;
