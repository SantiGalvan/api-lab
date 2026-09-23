import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get, post, patch, put, del, HTTPError } from './client.js';

describe('client.get', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the parsed body and status on a 2xx response', async () => {
    fetch.mockResolvedValue(
      new Response(JSON.stringify({ id: 1 }), { status: 200 }),
    );

    const result = await get('https://example.com/users/1');

    expect(result).toEqual({ status: 200, body: { id: 1 }, headers: expect.any(Headers) });
    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/users/1',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('exposes response headers so callers can read custom ones', async () => {
    fetch.mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200, headers: { token: 'session-abc' } }),
    );

    const result = await get('https://example.com/users/1');

    expect(result.headers.get('token')).toBe('session-abc');
  });

  it('throws HTTPError with status and body on a non-2xx response other than 401', async () => {
    fetch.mockImplementation(
      async () => new Response(JSON.stringify({ message: 'boom' }), { status: 500 }),
    );

    const error = await get('https://example.com/users/1').catch((e) => e);

    expect(error).toBeInstanceOf(HTTPError);
    expect(error).toMatchObject({ status: 500, body: { message: 'boom' } });
  });

  it('does not throw on a 401 response, and returns it for the caller to interpret', async () => {
    fetch.mockResolvedValue(
      new Response(JSON.stringify({ message: 'unauthorized' }), { status: 401 }),
    );

    const result = await get('https://example.com/users/1');

    expect(result).toEqual({
      status: 401,
      body: { message: 'unauthorized' },
      headers: expect.any(Headers),
    });
  });

  it('attaches the token as a query string param when mode is "query"', async () => {
    fetch.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

    await get('https://example.com/users/1', {
      token: { mode: 'query', value: 'abc123' },
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/users/1?token=abc123',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('attaches the token as an Authorization header when mode is "header"', async () => {
    fetch.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

    await get('https://example.com/users/1', {
      token: { mode: 'header', value: 'abc123' },
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/users/1',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer abc123' }),
      }),
    );
  });
});

describe('client write verbs (post/patch/put/del)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('post sends a JSON body with the right method and Content-Type', async () => {
    fetch.mockResolvedValue(new Response(JSON.stringify({ id: 2 }), { status: 201 }));

    const result = await post('https://example.com/users', { name: 'Ada' });

    expect(result).toEqual({ status: 201, body: { id: 2 }, headers: expect.any(Headers) });
    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/users',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Ada' }),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
  });

  it('patch and put send a JSON body with their own method', async () => {
    fetch.mockImplementation(async () => new Response(JSON.stringify({}), { status: 200 }));

    await patch('https://example.com/users/1', { name: 'Ada' });
    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/users/1',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ name: 'Ada' }) }),
    );

    await put('https://example.com/users/1', { name: 'Ada' });
    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/users/1',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ name: 'Ada' }) }),
    );
  });

  it('del sends no body', async () => {
    fetch.mockResolvedValue(new Response(null, { status: 204 }));

    const result = await del('https://example.com/users/1');

    expect(result).toEqual({ status: 204, body: undefined, headers: expect.any(Headers) });
    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/users/1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
