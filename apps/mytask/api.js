import { get, post, put, del, HTTPError } from '../../core/client/index.js';
import { createStaticAuthStrategy, createLoginAuthStrategy } from '../../core/auth/index.js';

function buildUrl(baseUrl, path) {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return new URL(path, base).toString();
}

/**
 * Calls MyTask's `POST /authenticate` with the given credentials and returns
 * the session token, which MyTask hands back as a `token` response header
 * (not in the body).
 * @param {string} baseUrl - MyTask base URL.
 * @param {{ email: string, password: string }} credentials.
 * @returns {Promise<string>} the session token.
 */
async function authenticate(baseUrl, credentials) {
  const result = await post(buildUrl(baseUrl, 'authenticate'), { auth: credentials });
  const token = result.headers.get('token');
  if (!token) {
    throw new HTTPError(result.status, result.body);
  }
  return token;
}

function createAuthStrategy(env, authMode, credentials) {
  if (authMode === 'm2m') {
    return createStaticAuthStrategy(env.token);
  }
  if (authMode === 'login') {
    return createLoginAuthStrategy({
      login: () => authenticate(env.baseUrl, credentials),
      mode: 'header',
    });
  }
  throw new Error(`mytask: unsupported auth mode "${authMode}"`);
}

/**
 * Builds the MyTask domain API bound to a resolved environment (see config.js).
 * Every domain function goes through the shared engine's HTTP verbs and auth
 * strategy — never through `fetch` directly.
 * @param {{ baseUrl: string, token: object, loginCredentials: { email: string, password: string } }} env - resolved MyTask environment.
 * @param {{ authMode?: 'm2m'|'login' }} [options] - `authMode` is `'m2m'` by default
 *   (see ADR 0001).
 * @returns {{ login: Function, createTask: Function, getTask: Function, updateTask: Function, deleteTask: Function }}
 */
export function makeMytaskApi(env, { authMode = 'm2m' } = {}) {
  const credentials = { ...env.loginCredentials };
  const strategy = createAuthStrategy(env, authMode, credentials);

  /**
   * Authenticates as a MyTask user, impersonating them for every following
   * call in this run. With no arguments, uses the env's default login
   * credentials (`MYTASK_LOGIN_EMAIL`/`MYTASK_LOGIN_PASSWORD`).
   * @param {string} [email] - user email; defaults to the env's login credentials.
   * @param {string} [password] - user password; defaults to the env's login credentials.
   * @returns {Promise<void>}
   */
  function login(email, password) {
    if (!strategy.refresh) {
      throw new Error(`mytask: login() requires authMode "login" (current: "${authMode}")`);
    }
    credentials.email = email ?? env.loginCredentials.email;
    credentials.password = password ?? env.loginCredentials.password;
    return strategy.refresh().then(() => undefined);
  }

  /**
   * Creates a new Task. MyTask expects Task fields nested under a `task` key
   * (Rails-style params wrapping), not as the bare body.
   * @param {object} payload - Task fields as expected by MyTask.
   * @returns {Promise<object>} the created Task.
   */
  function createTask(payload) {
    return strategy.request((token) => post(buildUrl(env.baseUrl, 'tasks'), { task: payload }, { token }));
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
   * Replaces a Task by id (MyTask's Task Update is a full PUT, not a partial
   * patch), again nesting the payload under a `task` key like createTask.
   * @param {string|number} id - Task id.
   * @param {object} payload - full Task representation to send.
   * @returns {Promise<object>} the updated Task.
   */
  function updateTask(id, payload) {
    return strategy.request((token) => put(buildUrl(env.baseUrl, `tasks/${id}`), { task: payload }, { token }));
  }

  /**
   * Deletes a Task by id.
   * @param {string|number} id - Task id.
   * @returns {Promise<object|undefined>} MyTask's response body, if any.
   */
  function deleteTask(id) {
    return strategy.request((token) => del(buildUrl(env.baseUrl, `tasks/${id}`), { token }));
  }

  return { login, createTask, getTask, updateTask, deleteTask };
}

export default makeMytaskApi;
