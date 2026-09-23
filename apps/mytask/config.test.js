import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getEnvironment } from './config.js';

describe('mytask config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.MYTASK_URI = 'https://mytask.example.com/api/';
    process.env.MYTASK_M2M_TOKEN = 'm2m-secret';
    process.env.MYTASK_LOGIN_EMAIL = 'admin@example.com';
    process.env.MYTASK_LOGIN_PASSWORD = 'admin-secret';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('resolves the production environment from MYTASK_URI and MYTASK_M2M_TOKEN', () => {
    const env = getEnvironment('production');

    expect(env).toEqual({
      baseUrl: 'https://mytask.example.com/api/',
      token: { mode: 'query', param: 'token', value: 'm2m-secret' },
      loginCredentials: { email: 'admin@example.com', password: 'admin-secret' },
    });
  });

  it('throws for an unknown environment name', () => {
    expect(() => getEnvironment('staging')).toThrow(/unknown environment/);
  });
});
