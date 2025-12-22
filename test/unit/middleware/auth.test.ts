import { describe, it, expect, beforeEach, vi } from 'vitest';
import authMiddleware from '~/src/runtime/middleware/auth.custom';
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

describe('auth middleware', () => {
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

  const createRouteContext = (path: string, fullPath?: string) => ({
    path,
    fullPath: fullPath || path,
    query: {},
    params: {},
    meta: {},
    name: 'test-route',
    hash: '',
    matched: [],
    redirectedFrom: undefined,
  });

  describe('when user is logged in', () => {
    beforeEach(() => {
      // Set up logged in user
      useState('user', () => ({ id: 1, name: 'John' }));
    });

    it('allows access (returns undefined)', () => {
      const to = createRouteContext('/dashboard');

      const result = authMiddleware(to as never, undefined as never);

      expect(result).toBeUndefined();
      expect(navigateTo).not.toHaveBeenCalled();
      expect(createError).not.toHaveBeenCalled();
    });
  });

  describe('when user is not logged in', () => {
    it('redirects to login path', () => {
      const to = createRouteContext('/dashboard');

      authMiddleware(to as never, undefined as never);

      expect(navigateTo).toHaveBeenCalledWith(
        { path: '/login' },
        { replace: true },
      );
    });

    it('includes redirect query when intendedEnabled is true', () => {
      setRuntimeConfigOptions({
        redirect: {
          intendedEnabled: true,
          login: '/login',
          postLogin: '/dashboard',
          postLogout: '/login',
        },
      });

      const to = createRouteContext('/protected', '/protected?foo=bar');

      authMiddleware(to as never, undefined as never);

      expect(navigateTo).toHaveBeenCalledWith(
        { path: '/login', query: { redirect: '/protected?foo=bar' } },
        { replace: true },
      );
    });

    it('does not include redirect query when intendedEnabled is false', () => {
      const to = createRouteContext('/protected', '/protected?foo=bar');

      authMiddleware(to as never, undefined as never);

      expect(navigateTo).toHaveBeenCalledWith(
        { path: '/login' },
        { replace: true },
      );
    });

    it('throws 403 error when login redirect is disabled', () => {
      setRuntimeConfigOptions({
        redirect: {
          intendedEnabled: false,
          login: false,
          postLogin: '/dashboard',
          postLogout: '/login',
        },
      });

      const to = createRouteContext('/protected');

      expect(() => authMiddleware(to as never, undefined as never)).toThrow();

      expect(createError).toHaveBeenCalledWith({ statusCode: 403 });
    });

    it('uses custom login path from config', () => {
      setRuntimeConfigOptions({
        redirect: {
          intendedEnabled: false,
          login: '/auth/signin',
          postLogin: '/dashboard',
          postLogout: '/login',
        },
      });

      const to = createRouteContext('/protected');

      authMiddleware(to as never, undefined as never);

      expect(navigateTo).toHaveBeenCalledWith(
        { path: '/auth/signin' },
        { replace: true },
      );
    });
  });
});
