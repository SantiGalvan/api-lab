import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeMytaskApi } from './api.js';

const env = {
  baseUrl: 'https://mytask.example.com/api/',
  token: { mode: 'query', param: 'token', value: 'm2m-secret' },
  loginCredentials: { email: 'admin@example.com', password: 'admin-secret' },
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
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ task: { title: 'Fix bug' } }),
      }),
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
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ task: { title: 'Updated' } }),
      }),
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
    expect(() => makeMytaskApi(env, { authMode: 'oauth' })).toThrow(/unsupported auth mode/);
  });
});

describe('makeMytaskApi login auth mode', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('login() with no arguments authenticates with the env default credentials', async () => {
    fetch.mockImplementation(async (url) => {
      if (url === 'https://mytask.example.com/api/authenticate') {
        return new Response(JSON.stringify({}), { status: 200, headers: { token: 'session-token' } });
      }
      return new Response(JSON.stringify({ id: 1 }), { status: 200 });
    });
    const api = makeMytaskApi(env, { authMode: 'login' });

    await api.login();
    const result = await api.getTask(1);

    expect(result).toEqual({ id: 1 });
    expect(fetch).toHaveBeenCalledWith(
      'https://mytask.example.com/api/authenticate',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ auth: { email: 'admin@example.com', password: 'admin-secret' } }),
      }),
    );
    expect(fetch).toHaveBeenCalledWith(
      'https://mytask.example.com/api/tasks/1',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer session-token' }),
      }),
    );
  });

  it('login(email, password) impersonates the given user instead of the env default', async () => {
    fetch.mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200, headers: { token: 'user-token' } }),
    );
    const api = makeMytaskApi(env, { authMode: 'login' });

    await api.login('utente@test', 'pwd');

    expect(fetch).toHaveBeenCalledWith(
      'https://mytask.example.com/api/authenticate',
      expect.objectContaining({
        body: JSON.stringify({ auth: { email: 'utente@test', password: 'pwd' } }),
      }),
    );
  });

  it('transparently refreshes and retries a domain call that gets a 401 in login mode', async () => {
    let taskCalls = 0;
    fetch.mockImplementation(async (url) => {
      if (url === 'https://mytask.example.com/api/authenticate') {
        return new Response(JSON.stringify({}), { status: 200, headers: { token: 'session-token' } });
      }
      taskCalls += 1;
      if (taskCalls === 1) {
        return new Response(JSON.stringify({ message: 'expired' }), { status: 401 });
      }
      return new Response(JSON.stringify({ id: 1 }), { status: 200 });
    });
    const api = makeMytaskApi(env, { authMode: 'login' });
    await api.login();

    const result = await api.getTask(1);

    expect(result).toEqual({ id: 1 });
    expect(taskCalls).toBe(2);
  });

  it('login() throws when the api is in m2m mode', () => {
    const api = makeMytaskApi(env, { authMode: 'm2m' });

    expect(() => api.login()).toThrow(/requires authMode "login"/);
  });
});
