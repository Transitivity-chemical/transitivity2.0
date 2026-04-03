import { ClientError } from './api-utils';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://pitomba.ueg.br';

export async function proxyToFastAPI<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${FASTAPI_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'FastAPI error' }));
    throw new ClientError(body.detail || `FastAPI error: ${res.status}`, res.status);
  }

  return res.json();
}
