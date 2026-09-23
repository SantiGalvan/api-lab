export class HTTPError extends Error {
  constructor(status, body) {
    super(`HTTP ${status}`);
    this.name = 'HTTPError';
    this.status = status;
    this.body = body;
  }
}

const parseBody = async (response) => {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const applyToken = (url, headers, token) => {
  if (!token) return url;

  if (token.mode === 'query') {
    const withToken = new URL(url);
    withToken.searchParams.set(token.param ?? 'token', token.value);
    return withToken.toString();
  }

  if (token.mode === 'header') {
    headers[token.header ?? 'Authorization'] = `${token.scheme ?? 'Bearer'} ${token.value}`;
  }

  return url;
};

const request = async (method, url, { token, body: payload } = {}) => {
  const headers = {};
  const finalUrl = applyToken(url, headers, token);

  if (payload !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(finalUrl, {
    method,
    headers,
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
  });
  const body = await parseBody(response);

  if (!response.ok && response.status !== 401) {
    throw new HTTPError(response.status, body);
  }

  return { status: response.status, body, headers: response.headers };
};

export const get = (url, opts) => request('GET', url, opts);

export const post = (url, body, opts) => request('POST', url, { ...opts, body });

export const patch = (url, body, opts) => request('PATCH', url, { ...opts, body });

export const put = (url, body, opts) => request('PUT', url, { ...opts, body });

export const del = (url, opts) => request('DELETE', url, opts);
