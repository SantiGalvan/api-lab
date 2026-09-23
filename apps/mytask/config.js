/**
 * MyTask environments.
 *
 * `production` reads its endpoint and M2M token from the process environment
 * (`MYTASK_URI`, `MYTASK_M2M_TOKEN`, see `.env.example`) and declares the m2m
 * token as a query-string param, matching how MyTask's real API attaches it
 * (see docs/adr/0001-mytask-dual-auth-mode.md).
 */
const environments = {
  production: {
    get baseUrl() {
      return process.env.MYTASK_URI;
    },
    get token() {
      return { mode: 'query', param: 'token', value: process.env.MYTASK_M2M_TOKEN };
    },
  },
};

/**
 * Resolves a named MyTask environment.
 * @param {string} name - environment name, e.g. "production".
 * @returns {{ baseUrl: string, token: { mode: string, param: string, value: string } }}
 */
export function getEnvironment(name) {
  const env = environments[name];
  if (!env) {
    throw new Error(`mytask: unknown environment "${name}"`);
  }
  return { baseUrl: env.baseUrl, token: env.token };
}

export default getEnvironment;
