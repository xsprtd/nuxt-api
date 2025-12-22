import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuth } from '~/src/runtime/composables/useAuth';
import { useHttp } from '~/src/runtime/composables/useHttp';
import authMiddleware from '~/src/runtime/middleware/auth.custom';
import guestMiddleware from '~/src/runtime/middleware/guest.custom';
import {
  clearStateStore,
  clearCookieStore,
  setRuntimeConfigOptions,
  navigateTo,
  useRoute,
} from '../mocks/app';

// Mock $fetch and $fetch.create
const mockFetchInstance = vi.fn();
const mockFetch = Object.assign(vi.fn(), {
  create: vi.fn(() => mockFetchInstance),
});
vi.stubGlobal('$fetch', mockFetch);

describe('full authentication flow - cookie mode', () => {
  beforeEach(() => {
    clearStateStore();
    clearCookieStore();
    setRuntimeConfigOptions({
      authMode: 'cookie',
      csrf: {
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      },
      endpoints: {
        csrf: '/sanctum/csrf-cookie',
        login: '/api/login',
        logout: '/api/logout',
        user: '/api/user',
      },
      redirect: {
        intendedEnabled: true,
        login: '/login',
        postLogin: '/dashboard',
        postLogout: '/login',
      },
    });
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});

    useRoute.mockReturnValue({
      path: '/login',
      fullPath: '/login',
      query: {},
      params: {},
      meta: {},
    });
  });

  const createRouteContext = (path: string, query: Record<string, string> = {}) => ({
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

  describe('unauthenticated user journey', () => {
    it('blocks access to protected routes and redirects to login', () => {
      const to = createRouteContext('/dashboard');

      authMiddleware(to as never, undefined as never);

      expect(navigateTo).toHaveBeenCalledWith(
        { path: '/login', query: { redirect: '/dashboard' } },
        { replace: true },
      );
    });

    it('allows access to guest routes (login page)', async () => {
      const to = createRouteContext('/login');

      const result = await guestMiddleware(to as never, undefined as never);

      expect(result).toBeUndefined();
      expect(navigateTo).not.toHaveBeenCalled();
    });
  });

  describe('login flow', () => {
    it('completes full login flow: login -> fetch user -> redirect', async () => {
      const loginResponse = { success: true };
      const userData = { id: 1, name: 'John', email: 'john@example.com' };

      mockFetchInstance
        .mockResolvedValueOnce(loginResponse) // POST /api/login
        .mockResolvedValueOnce(userData); // GET /api/user

      const { login, user, isLoggedIn } = useAuth();

      expect(isLoggedIn.value).toBe(false);
      expect(user.value).toBeNull();

      await login({ email: 'john@example.com', password: 'secret' });

      expect(isLoggedIn.value).toBe(true);
      expect(user.value).toEqual(userData);
      expect(navigateTo).toHaveBeenCalledWith('/dashboard');
    });

    it('redirects to intended route after login', async () => {
      useRoute.mockReturnValue({
        path: '/login',
        fullPath: '/login?redirect=/profile',
        query: { redirect: '/profile' },
        params: {},
        meta: {},
      });

      mockFetchInstance
        .mockResolvedValueOnce({ success: true }) // login
        .mockResolvedValueOnce({ id: 1 }); // user

      const { login } = useAuth();
      await login({ email: 'test@example.com', password: 'secret' });

      expect(navigateTo).toHaveBeenCalledWith('/profile');
    });

    it('handles validation errors during login', async () => {
      const error = new Error('Validation failed') as Error & {
        response: { status: number; _data: unknown };
      };
      error.response = {
        status: 422,
        _data: {
          message: 'The given data was invalid.',
          errors: {
            email: ['These credentials do not match our records.'],
          },
        },
      };
      mockFetchInstance.mockRejectedValueOnce(error);

      const { login, errorBag, isLoggedIn } = useAuth();

      await expect(login({ email: 'wrong@example.com', password: 'wrong' })).rejects.toThrow();

      expect(isLoggedIn.value).toBe(false);
      expect(errorBag.message.value).toBe('The given data was invalid.');
      expect(errorBag.has('email')).toBe(true);
      expect(errorBag.get('email')).toBe('These credentials do not match our records.');
    });
  });

  describe('authenticated user journey', () => {
    beforeEach(async () => {
      // Login first
      mockFetchInstance
        .mockResolvedValueOnce({ success: true }) // login
        .mockResolvedValueOnce({ id: 1, name: 'John' }); // user

      const { login } = useAuth();
      await login({ email: 'john@example.com', password: 'secret' });
      vi.clearAllMocks();
    });

    it('allows access to protected routes', () => {
      const to = createRouteContext('/dashboard');

      const result = authMiddleware(to as never, undefined as never);

      expect(result).toBeUndefined();
      expect(navigateTo).not.toHaveBeenCalled();
    });

    it('redirects away from guest routes (login page)', async () => {
      const to = createRouteContext('/login');

      await guestMiddleware(to as never, undefined as never);

      expect(navigateTo).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('can make authenticated API requests', async () => {
      mockFetchInstance.mockResolvedValueOnce({ items: [] });

      const { get } = useHttp();
      const response = await get('/api/items');

      expect(mockFetchInstance).toHaveBeenCalledWith('/api/items', expect.any(Object));
      expect(response).toEqual({ items: [] });
    });
  });

  describe('logout flow', () => {
    beforeEach(async () => {
      // Login first
      mockFetchInstance
        .mockResolvedValueOnce({ success: true }) // login
        .mockResolvedValueOnce({ id: 1, name: 'John' }); // user

      const { login } = useAuth();
      await login({ email: 'john@example.com', password: 'secret' });
      vi.clearAllMocks();

      useRoute.mockReturnValue({
        path: '/dashboard',
        fullPath: '/dashboard',
        query: {},
        params: {},
        meta: {},
      });
    });

    it('completes full logout flow: logout -> clear user -> redirect', async () => {
      mockFetchInstance.mockResolvedValueOnce({}); // logout

      const { logout, user, isLoggedIn } = useAuth();

      expect(isLoggedIn.value).toBe(true);

      await logout();

      expect(isLoggedIn.value).toBe(false);
      expect(user.value).toBeNull();
      expect(navigateTo).toHaveBeenCalledWith('/login');
    });

    it('blocks access to protected routes after logout', async () => {
      mockFetchInstance.mockResolvedValueOnce({}); // logout

      const { logout } = useAuth();
      await logout();
      vi.clearAllMocks();

      const to = createRouteContext('/dashboard');

      useRoute.mockReturnValue({
        path: '/login',
        fullPath: '/login',
        query: {},
        params: {},
        meta: {},
      });

      authMiddleware(to as never, undefined as never);

      expect(navigateTo).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/login' }),
        { replace: true },
      );
    });
  });

  describe('session expiry handling', () => {
    beforeEach(async () => {
      // Login first
      mockFetchInstance
        .mockResolvedValueOnce({ success: true }) // login
        .mockResolvedValueOnce({ id: 1, name: 'John' }); // user

      const { login } = useAuth();
      await login({ email: 'john@example.com', password: 'secret' });
      vi.clearAllMocks();
    });

    it('clears user state on 401 response', async () => {
      const error = new Error('Unauthorized') as Error & {
        response: { status: number; _data: unknown };
      };
      error.response = { status: 401, _data: {} };
      mockFetchInstance.mockRejectedValueOnce(error);

      const { get } = useHttp();
      const { user, isLoggedIn } = useAuth();

      expect(isLoggedIn.value).toBe(true);

      await expect(get('/api/protected')).rejects.toThrow();

      // User should be cleared due to 401
      expect(user.value).toBeNull();
      expect(isLoggedIn.value).toBe(false);
    });
  });
});
