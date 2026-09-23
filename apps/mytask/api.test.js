import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeMytaskApi } from './api.js';

const env = {
  baseUrl: 'https://mytask.example.com/api/',
  token: { mode: 'query', param: 'token', value: 'm2m-secret' },
};

describe('makeMytaskApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('createTask posts the payload to tasks', async () => {
    fetch.mockResolvedValue(
      new Response(JSON.stringify({ id: 1, title: 'Fix bug' }), { status: 201 }),
    );
    const api = makeMytaskApi(env);

    const result = await api.createTask({ title: 'Fix bug' });

    expect(result).toEqual({ id: 1, title: 'Fix bug' });
    expect(fetch).toHaveBeenCalledWith(
      'https://mytask.example.com/api/tasks?token=m2m-secret',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ title: 'Fix bug' }) }),
    );
  });

  it('getTask fetches tasks/:id', async () => {
    fetch.mockResolvedValue(new Response(JSON.stringify({ id: 1 }), { status: 200 }));
    const api = makeMytaskApi(env);

    const result = await api.getTask(1);

    expect(result).toEqual({ id: 1 });
    expect(fetch).toHaveBeenCalledWith(
      'https://mytask.example.com/api/tasks/1?token=m2m-secret',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('updateTask puts the full payload to tasks/:id', async () => {
    fetch.mockResolvedValue(
      new Response(JSON.stringify({ id: 1, title: 'Updated' }), { status: 200 }),
    );
    const api = makeMytaskApi(env);

    const result = await api.updateTask(1, { title: 'Updated' });

    expect(result).toEqual({ id: 1, title: 'Updated' });
    expect(fetch).toHaveBeenCalledWith(
      'https://mytask.example.com/api/tasks/1?token=m2m-secret',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ title: 'Updated' }) }),
    );
  });

  it('deleteTask deletes tasks/:id', async () => {
    fetch.mockResolvedValue(new Response(null, { status: 204 }));
    const api = makeMytaskApi(env);

    await api.deleteTask(1);

    expect(fetch).toHaveBeenCalledWith(
      'https://mytask.example.com/api/tasks/1?token=m2m-secret',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('throws for an unsupported auth mode', () => {
    expect(() => makeMytaskApi(env, { authMode: 'login' })).toThrow(/unsupported auth mode/);
  });
});
