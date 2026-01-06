import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthMiddleware } from '~/src/runtime/composables/useAuthMiddleware';
import {
  clearStateStore,
  clearCookieStore,
  setRuntimeConfigOptions,
  useState,
} from '../../mocks/app';

// Mock $fetch and $fetch.create for useAuth
const mockFetchInstance = vi.fn();
const mockFetch = Object.assign(vi.fn(), {
  create: vi.fn(() => mockFetchInstance),
});
vi.stubGlobal('$fetch', mockFetch);

describe('useAuthMiddleware', () => {
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

  const createRouteContext = (path: string, fullPath?: string, query: Record<string, string> = {}) => ({
    path,
    fullPath: fullPath || path,
    query,
    params: {},
    meta: {},
    name: 'test-route',
    hash: '',
    matched: [],
    redirectedFrom: undefined,
  });

  describe('checkAuth()', () => {
    describe('when user is logged in', () => {
      beforeEach(() => {
        useState('user', () => ({ id: 1, name: 'John' }));
      });

      it('returns isAuthenticated true and no redirect', () => {
        const { checkAuth } = useAuthMiddleware();
        const to = createRouteContext('/dashboard');

        const result = checkAuth(to as never);

        expect(result.isAuthenticated).toBe(true);
        expect(result.redirectTo).toBeNull();
      });
    });

    describe('when user is not logged in', () => {
      it('returns isAuthenticated false with redirect to login', () => {
        const { checkAuth } = useAuthMiddleware();
        const to = createRouteContext('/dashboard');

        const result = checkAuth(to as never);

        expect(result.isAuthenticated).toBe(false);
        expect(result.redirectTo).toEqual({ path: '/login' });
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

        const { checkAuth } = useAuthMiddleware();
        const to = createRouteContext('/protected', '/protected?foo=bar');

        const result = checkAuth(to as never);

        expect(result.isAuthenticated).toBe(false);
        expect(result.redirectTo).toEqual({
          path: '/login',
          query: { redirect: '/protected?foo=bar' },
        });
      });

      it('returns no redirect when login path is false', () => {
        setRuntimeConfigOptions({
          redirect: {
            intendedEnabled: false,
            login: false,
            postLogin: '/dashboard',
            postLogout: '/login',
          },
        });

        const { checkAuth } = useAuthMiddleware();
        const to = createRouteContext('/protected');

        const result = checkAuth(to as never);

        expect(result.isAuthenticated).toBe(false);
        expect(result.redirectTo).toBeNull();
      });
    });
  });

  describe('checkGuest()', () => {
    describe('when user is not logged in', () => {
      it('returns isAuthenticated false and no redirect', () => {
        const { checkGuest } = useAuthMiddleware();
        const to = createRouteContext('/login');

        const result = checkGuest(to as never);

        expect(result.isAuthenticated).toBe(false);
        expect(result.redirectTo).toBeNull();
      });
    });

    describe('when user is logged in', () => {
      beforeEach(() => {
        useState('user', () => ({ id: 1, name: 'John' }));
      });

      it('returns isAuthenticated true with redirect to postLogin', () => {
        const { checkGuest } = useAuthMiddleware();
        const to = createRouteContext('/login');

        const result = checkGuest(to as never);

        expect(result.isAuthenticated).toBe(true);
        expect(result.redirectTo).toBe('/dashboard');
      });

      it('redirects to intended route when intendedEnabled and redirect query exists', () => {
        setRuntimeConfigOptions({
          redirect: {
            intendedEnabled: true,
            login: '/login',
            postLogin: '/dashboard',
            postLogout: '/login',
          },
        });

        const { checkGuest } = useAuthMiddleware();
        const to = createRouteContext('/login', '/login?redirect=/profile', { redirect: '/profile' });

        const result = checkGuest(to as never);

        expect(result.isAuthenticated).toBe(true);
        expect(result.redirectTo).toBe('/profile');
      });

      it('does not redirect to same path from query', () => {
        setRuntimeConfigOptions({
          redirect: {
            intendedEnabled: true,
            login: '/login',
            postLogin: '/dashboard',
            postLogout: '/login',
          },
        });

        const { checkGuest } = useAuthMiddleware();
        const to = createRouteContext('/login', '/login?redirect=/login', { redirect: '/login' });

        const result = checkGuest(to as never);

        expect(result.isAuthenticated).toBe(true);
        expect(result.redirectTo).toBe('/dashboard');
      });

      it('returns no redirect when postLogin is false', () => {
        setRuntimeConfigOptions({
          redirect: {
            intendedEnabled: false,
            login: '/login',
            postLogin: false,
            postLogout: '/login',
          },
        });

        const { checkGuest } = useAuthMiddleware();
        const to = createRouteContext('/login');

        const result = checkGuest(to as never);

        expect(result.isAuthenticated).toBe(true);
        expect(result.redirectTo).toBeNull();
      });
    });
  });

  describe('isLoggedIn', () => {
    it('returns false when user is not set', () => {
      const { isLoggedIn } = useAuthMiddleware();

      expect(isLoggedIn.value).toBe(false);
    });

    it('returns true when user is set', () => {
      useState('user', () => ({ id: 1, name: 'John' }));

      const { isLoggedIn } = useAuthMiddleware();

      expect(isLoggedIn.value).toBe(true);
    });
  });
});
