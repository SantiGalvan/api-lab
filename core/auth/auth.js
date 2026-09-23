import { HTTPError } from '../client/client.js';

export function createLoginAuthStrategy({ login, mode, param, header, scheme }) {
  let cachedValue = null;

  function toToken(value) {
    return { mode, value, param, header, scheme };
  }

  return {
    async request(requestFn) {
      if (cachedValue === null) {
        cachedValue = await login();
      }

      const result = await requestFn(toToken(cachedValue));
      if (result.status !== 401) {
        return result.body;
      }

      cachedValue = await login();
      const retryResult = await requestFn(toToken(cachedValue));
      if (retryResult.status === 401) {
        throw new HTTPError(retryResult.status, retryResult.body);
      }
      return retryResult.body;
    },

    async refresh() {
      cachedValue = await login();
      return cachedValue;
    },
  };
}

export function createStaticAuthStrategy({ mode, value, param, header, scheme }) {
  const token = { mode, value, param, header, scheme };

  return {
    async request(requestFn) {
      const result = await requestFn(token);
      if (result.status === 401) {
        throw new HTTPError(result.status, result.body);
      }
      return result.body;
    },
  };
}
