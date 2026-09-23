/**
 * MyTask environments.
 *
 * `production` reads its endpoint and M2M token from the process environment
 * (`MYTASK_URI`, `MYTASK_M2M_TOKEN`, see `.env.example`) and declares the m2m
 * token as a query-string param, matching how MyTask's real API attaches it
 * (see docs/adr/0001-mytask-dual-auth-mode.md). `MYTASK_LOGIN_EMAIL`/
 * `MYTASK_LOGIN_PASSWORD` are the default credentials for the `login` auth
 * mode, used when `login()` is called without arguments. `MYTASK_FIXTURE_*`
 * point at pre-existing records (a Project, a User, a Task Type) that
 * scenarios reference instead of creating themselves — Project/User/Task
 * Type management is out of scope for api-lab.
 */
const environments = {
  production: {
    get baseUrl() {
      return process.env.MYTASK_URI;
    },
    get token() {
      return { mode: 'query', param: 'token', value: process.env.MYTASK_M2M_TOKEN };
    },
    get loginCredentials() {
      return { email: process.env.MYTASK_LOGIN_EMAIL, password: process.env.MYTASK_LOGIN_PASSWORD };
    },
    get fixtureProjectId() {
      return process.env.MYTASK_FIXTURE_PROJECT_ID;
    },
    get fixtureUserId() {
      return process.env.MYTASK_FIXTURE_USER_ID;
    },
    get fixtureTaskTypeId() {
      return process.env.MYTASK_FIXTURE_TASK_TYPE_ID;
    },
  },
};

/**
 * Resolves a named MyTask environment.
 * @param {string} name - environment name, e.g. "production".
 * @returns {{ baseUrl: string, token: { mode: string, param: string, value: string }, loginCredentials: { email: string, password: string }, fixtureProjectId: string, fixtureUserId: string, fixtureTaskTypeId: string }}
 */
export function getEnvironment(name) {
  const env = environments[name];
  if (!env) {
    throw new Error(`mytask: unknown environment "${name}"`);
  }
  return {
    baseUrl: env.baseUrl,
    token: env.token,
    loginCredentials: env.loginCredentials,
    fixtureProjectId: env.fixtureProjectId,
    fixtureUserId: env.fixtureUserId,
    fixtureTaskTypeId: env.fixtureTaskTypeId,
  };
}

export default getEnvironment;
