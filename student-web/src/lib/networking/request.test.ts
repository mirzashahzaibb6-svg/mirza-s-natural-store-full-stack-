import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { API_URL } from '@/lib/config';
import { useAuthStore } from '@/store/auth-store';
import { ApiError } from './api-error';
import { request } from './request';

const server = setupServer();
const user = { id: 'u1', name: 'Ali', email: 'a@b.c', role: 'CUSTOMER' as const, isActive: true };

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
beforeEach(() => useAuthStore.setState({ token: 'tok', user, hydrated: true }));

describe('request()', () => {
  it('sends the Bearer token and parses JSON', async () => {
    let auth = '';
    server.use(http.get(`${API_URL}/cart`, ({ request: r }) => { auth = r.headers.get('authorization') ?? ''; return HttpResponse.json({ ok: true }); }));
    await expect(request<{ ok: boolean }>('/cart')).resolves.toEqual({ ok: true });
    expect(auth).toBe('Bearer tok');
  });

  it('returns undefined for 204', async () => {
    server.use(http.delete(`${API_URL}/cart`, () => new HttpResponse(null, { status: 204 })));
    await expect(request<void>('/cart', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('401 on an authenticated call clears the session', async () => {
    server.use(http.get(`${API_URL}/auth/me`, () => HttpResponse.json({ message: 'Invalid or expired token' }, { status: 401 })));
    await expect(request('/auth/me')).rejects.toMatchObject({ status: 401 });
    expect(useAuthStore.getState().token).toBeNull();
  });

  it.each([429, 500, 503])('%i never logs the user out', async (status) => {
    server.use(http.get(`${API_URL}/cart`, () => HttpResponse.json({ message: 'nope' }, { status })));
    await expect(request('/cart')).rejects.toBeInstanceOf(ApiError);
    expect(useAuthStore.getState().token).toBe('tok');
  });

  it('a network failure never logs the user out and is flagged as a network error', async () => {
    server.use(http.get(`${API_URL}/cart`, () => HttpResponse.error()));
    const error = await request('/cart').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isNetwork).toBe(true);
    expect(useAuthStore.getState().token).toBe('tok');
  });

  it('keeps every validation message from the API', async () => {
    server.use(http.post(`${API_URL}/auth/login`, () => HttpResponse.json({ message: ['email must be an email', 'password too short'] }, { status: 400 })));
    const error = (await request('/auth/login', { method: 'POST', body: {}, auth: false }).catch((e: unknown) => e)) as ApiError;
    expect(error.messages).toHaveLength(2);
    expect(error.message).toBe('email must be an email');
  });
});
