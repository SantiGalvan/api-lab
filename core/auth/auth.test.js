import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from '../client/client.js';
import { createStaticAuthStrategy, createLoginAuthStrategy } from './auth.js';
import { HTTPError } from '../client/client.js';

describe('static auth strategy', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('attaches the configured token and returns the body on success', async () => {
    fetch.mockResolvedValue(new Response(JSON.stringify({ id: 1 }), { status: 200 }));
    const strategy = createStaticAuthStrategy({ mode: 'query', value: 'm2m-token' });

    const result = await strategy.request((token) => get('https://example.com/users/1', { token }));

    expect(result).toEqual({ id: 1 });
    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/users/1?token=m2m-token',
      expect.anything(),
    );
  });

  it('never refreshes on a 401 and propagates it as an HTTPError', async () => {
    fetch.mockResolvedValue(
      new Response(JSON.stringify({ message: 'unauthorized' }), { status: 401 }),
    );
    const strategy = createStaticAuthStrategy({ mode: 'query', value: 'm2m-token' });

    const error = await strategy
      .request((token) => get('https://example.com/users/1', { token }))
      .catch((e) => e);

    expect(error).toBeInstanceOf(HTTPError);
    expect(error).toMatchObject({ status: 401, body: { message: 'unauthorized' } });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('login auth strategy', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('logs in lazily on first request and attaches the resulting token', async () => {
    fetch.mockResolvedValue(new Response(JSON.stringify({ id: 1 }), { status: 200 }));
    const login = vi.fn().mockResolvedValue('session-token');
    const strategy = createLoginAuthStrategy({ login, mode: 'header' });

    const result = await strategy.request((token) => get('https://example.com/users/1', { token }));

    expect(result).toEqual({ id: 1 });
    expect(login).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/users/1',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer session-token' }),
      }),
    );
  });

  it('reuses the token in memory on a second request without logging in again', async () => {
    fetch.mockImplementation(async () => new Response(JSON.stringify({ id: 1 }), { status: 200 }));
    const login = vi.fn().mockResolvedValue('session-token');
    const strategy = createLoginAuthStrategy({ login, mode: 'header' });

    await strategy.request((token) => get('https://example.com/users/1', { token }));
    await strategy.request((token) => get('https://example.com/users/2', { token }));

    expect(login).toHaveBeenCalledTimes(1);
  });

  it('refreshes the token and retries the original request once on a 401', async () => {
    let call = 0;
    fetch.mockImplementation(async () => {
      call += 1;
      if (call === 1) {
        return new Response(JSON.stringify({ message: 'expired' }), { status: 401 });
      }
      return new Response(JSON.stringify({ id: 1 }), { status: 200 });
    });
    const login = vi.fn().mockResolvedValueOnce('stale-token').mockResolvedValueOnce('fresh-token');
    const strategy = createLoginAuthStrategy({ login, mode: 'header' });

    const result = await strategy.request((token) => get('https://example.com/users/1', { token }));

    expect(result).toEqual({ id: 1 });
    expect(login).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'https://example.com/users/1',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer fresh-token' }),
      }),
    );
  });

  it('propagates an HTTPError if the retried request also gets a 401', async () => {
    fetch.mockImplementation(
      async () => new Response(JSON.stringify({ message: 'still expired' }), { status: 401 }),
    );
    const login = vi.fn().mockResolvedValue('stale-token');
    const strategy = createLoginAuthStrategy({ login, mode: 'header' });

    const error = await strategy
      .request((token) => get('https://example.com/users/1', { token }))
      .catch((e) => e);

    expect(error).toBeInstanceOf(HTTPError);
    expect(error).toMatchObject({ status: 401, body: { message: 'still expired' } });
    expect(login).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
