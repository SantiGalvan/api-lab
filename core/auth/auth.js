import { HTTPError } from '../client/client.js';

export const createLoginAuthStrategy = ({ login, mode, param, header, scheme }) => {
  let cachedValue = null;

  const toToken = (value) => ({ mode, value, param, header, scheme });

  return {
    request: async (requestFn) => {
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

    refresh: async () => {
      cachedValue = await login();
      return cachedValue;
    },
  };
};

export const createStaticAuthStrategy = ({ mode, value, param, header, scheme }) => {
  const token = { mode, value, param, header, scheme };

  return {
    request: async (requestFn) => {
      const result = await requestFn(token);
      if (result.status === 401) {
        throw new HTTPError(result.status, result.body);
      }
      return result.body;
    },
  };
};
