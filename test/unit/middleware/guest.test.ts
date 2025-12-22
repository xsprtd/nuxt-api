import { describe, it, expect, beforeEach, vi } from 'vitest';
import guestMiddleware from '~/src/runtime/middleware/guest.custom';
import {
  clearStateStore,
  clearCookieStore,
  setRuntimeConfigOptions,
  navigateTo,
  createError,
  useState,
} from '../../mocks/app';

// Mock $fetch and $fetch.create for useAuth
const mockFetchInstance = vi.fn();
const mockFetch = Object.assign(vi.fn(), {
  create: vi.fn(() => mockFetchInstance),
});
vi.stubGlobal('$fetch', mockFetch);

describe('guest middleware', () => {
  beforeEach(() => {
    clearStateStore();
    clearCookieStore();
    setRuntimeConfigOptions({
      redirect: {
        intendedEnabled: false,
        login: '/login',
        postLogin: '/dashboard',
        postLogout: '/login',
      },
    });
    vi.clearAllMocks();
  });

  const createRouteContext = (
    path: string,
    query: Record<string, string> = {},
  ) => ({
    path,
    fullPath: path + (Object.keys(query).length ? '?' + new URLSearchParams(query).toString() : ''),
    query,
    params: {},
    meta: {},
    name: 'test-route',
    hash: '',
    matched: [],
    redirectedFrom: undefined,
  });

  describe('when user is not logged in', () => {
    it('allows access (returns undefined)', async () => {
      const to = createRouteContext('/login');

      const result = await guestMiddleware(to as never, undefined as never);

      expect(result).toBeUndefined();
      expect(navigateTo).not.toHaveBeenCalled();
      expect(createError).not.toHaveBeenCalled();
    });
  });

  describe('when user is logged in', () => {
    beforeEach(() => {
      // Set up logged in user
      useState('user', () => ({ id: 1, name: 'John' }));
    });

    it('redirects to postLogin path', async () => {
      const to = createRouteContext('/login');

      await guestMiddleware(to as never, undefined as never);

      expect(navigateTo).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('redirects to intended route when intendedEnabled is true', async () => {
      setRuntimeConfigOptions({
        redirect: {
          intendedEnabled: true,
          login: '/login',
          postLogin: '/dashboard',
          postLogout: '/login',
        },
      });

      const to = createRouteContext('/login', { redirect: '/profile' });

      await guestMiddleware(to as never, undefined as never);

      expect(navigateTo).toHaveBeenCalledWith('/profile');
    });

    it('does not redirect to intended route if same as current path', async () => {
      setRuntimeConfigOptions({
        redirect: {
          intendedEnabled: true,
          login: '/login',
          postLogin: '/dashboard',
          postLogout: '/login',
        },
      });

      const to = createRouteContext('/login', { redirect: '/login' });

      await guestMiddleware(to as never, undefined as never);

      // Should fall through to postLogin redirect
      expect(navigateTo).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('falls back to postLogin when no redirect query', async () => {
      setRuntimeConfigOptions({
        redirect: {
          intendedEnabled: true,
          login: '/login',
          postLogin: '/dashboard',
          postLogout: '/login',
        },
      });

      const to = createRouteContext('/login');

      await guestMiddleware(to as never, undefined as never);

      expect(navigateTo).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('throws 403 error when postLogin redirect is disabled', async () => {
      setRuntimeConfigOptions({
        redirect: {
          intendedEnabled: false,
          login: '/login',
          postLogin: false,
          postLogout: '/login',
        },
      });

      const to = createRouteContext('/login');

      await expect(
        guestMiddleware(to as never, undefined as never),
      ).rejects.toThrow();

      expect(createError).toHaveBeenCalledWith({ statusCode: 403 });
    });

    it('uses custom postLogin path from config', async () => {
      setRuntimeConfigOptions({
        redirect: {
          intendedEnabled: false,
          login: '/login',
          postLogin: '/home',
          postLogout: '/login',
        },
      });

      const to = createRouteContext('/login');

      await guestMiddleware(to as never, undefined as never);

      expect(navigateTo).toHaveBeenCalledWith('/home', { replace: true });
    });
  });
});
