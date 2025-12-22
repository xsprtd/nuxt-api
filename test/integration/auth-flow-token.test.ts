import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuth } from '~/src/runtime/composables/useAuth';
import { useTokenStorage } from '~/src/runtime/composables/useTokenStorage';
import {
  clearStateStore,
  clearCookieStore,
  setRuntimeConfigOptions,
  navigateTo,
  useRoute,
  useCookie,
} from '../mocks/app';

// Mock $fetch and $fetch.create
const mockFetchInstance = vi.fn();
const mockFetch = Object.assign(vi.fn(), {
  create: vi.fn(() => mockFetchInstance),
});
vi.stubGlobal('$fetch', mockFetch);

describe('full authentication flow - token mode', () => {
  beforeEach(() => {
    clearStateStore();
    clearCookieStore();
    setRuntimeConfigOptions({
      authMode: 'token',
      token: {
        storageKey: 'AUTH_TOKEN',
        storageType: 'cookie',
        responseKey: 'token',
      },
      endpoints: {
        csrf: '/sanctum/csrf-cookie',
        login: '/api/login',
        logout: '/api/logout',
        user: '/api/user',
      },
      redirect: {
        intendedEnabled: false,
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

  describe('login flow with token', () => {
    it('extracts and stores token from login response', async () => {
      const loginResponse = { token: 'jwt-token-123', user: { id: 1 } };
      const userData = { id: 1, name: 'John' };

      mockFetchInstance
        .mockResolvedValueOnce(loginResponse) // POST /api/login
        .mockResolvedValueOnce(userData); // GET /api/user

      const { login } = useAuth();
      await login({ email: 'john@example.com', password: 'secret' });

      // Verify token was stored
      const tokenStorage = useTokenStorage();
      const storedToken = await tokenStorage.get();
      expect(storedToken).toBe('jwt-token-123');
    });

    it('extracts token with nested response key', async () => {
      setRuntimeConfigOptions({
        authMode: 'token',
        token: {
          storageKey: 'AUTH_TOKEN',
          storageType: 'cookie',
          responseKey: 'data.access_token',
        },
        endpoints: {
          csrf: '/sanctum/csrf-cookie',
          login: '/api/login',
          logout: '/api/logout',
          user: '/api/user',
        },
        redirect: {
          intendedEnabled: false,
          login: '/login',
          postLogin: '/dashboard',
          postLogout: '/login',
        },
      });

      const loginResponse = {
        data: {
          access_token: 'nested-jwt-token',
          expires_in: 3600,
        },
      };

      mockFetchInstance
        .mockResolvedValueOnce(loginResponse) // login
        .mockResolvedValueOnce({ id: 1 }); // user

      const { login } = useAuth();
      await login({ email: 'john@example.com', password: 'secret' });

      const storedToken = useCookie('AUTH_TOKEN').value;
      expect(storedToken).toBe('nested-jwt-token');
    });

    it('completes full login flow: login -> store token -> fetch user -> redirect', async () => {
      const loginResponse = { token: 'jwt-token-xyz' };
      const userData = { id: 1, name: 'John', email: 'john@example.com' };

      mockFetchInstance
        .mockResolvedValueOnce(loginResponse) // login
        .mockResolvedValueOnce(userData); // user

      const { login, user, isLoggedIn } = useAuth();

      expect(isLoggedIn.value).toBe(false);

      await login({ email: 'john@example.com', password: 'secret' });

      // Token should be stored
      const storedToken = useCookie('AUTH_TOKEN').value;
      expect(storedToken).toBe('jwt-token-xyz');

      // User should be populated
      expect(isLoggedIn.value).toBe(true);
      expect(user.value).toEqual(userData);

      // Should redirect to dashboard
      expect(navigateTo).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('token storage options', () => {
    it('stores token in cookie when storageType is cookie', async () => {
      mockFetchInstance
        .mockResolvedValueOnce({ token: 'cookie-token' }) // login
        .mockResolvedValueOnce({ id: 1 }); // user

      const { login } = useAuth();
      await login({ email: 'test@example.com', password: 'secret' });

      const cookieToken = useCookie('AUTH_TOKEN').value;
      expect(cookieToken).toBe('cookie-token');
    });

    it('uses custom storage key from config', async () => {
      setRuntimeConfigOptions({
        authMode: 'token',
        token: {
          storageKey: 'CUSTOM_TOKEN_KEY',
          storageType: 'cookie',
          responseKey: 'token',
        },
        endpoints: {
          csrf: '/sanctum/csrf-cookie',
          login: '/api/login',
          logout: '/api/logout',
          user: '/api/user',
        },
        redirect: {
          intendedEnabled: false,
          login: '/login',
          postLogin: '/dashboard',
          postLogout: '/login',
        },
      });

      mockFetchInstance
        .mockResolvedValueOnce({ token: 'custom-key-token' }) // login
        .mockResolvedValueOnce({ id: 1 }); // user

      const { login } = useAuth();
      await login({ email: 'test@example.com', password: 'secret' });

      const customToken = useCookie('CUSTOM_TOKEN_KEY').value;
      expect(customToken).toBe('custom-key-token');
    });
  });

  describe('authenticated requests with token', () => {
    beforeEach(async () => {
      // Login and store token
      mockFetchInstance
        .mockResolvedValueOnce({ token: 'bearer-token' }) // login
        .mockResolvedValueOnce({ id: 1, name: 'John' }); // user

      const { login } = useAuth();
      await login({ email: 'john@example.com', password: 'secret' });
      vi.clearAllMocks();
    });

    it('token is available for subsequent requests', async () => {
      const tokenStorage = useTokenStorage();
      const token = await tokenStorage.get();

      expect(token).toBe('bearer-token');
    });
  });

  describe('logout flow with token', () => {
    beforeEach(async () => {
      // Login first
      mockFetchInstance
        .mockResolvedValueOnce({ token: 'jwt-to-clear' }) // login
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

    it('clears user state on logout', async () => {
      mockFetchInstance.mockResolvedValueOnce({}); // logout

      const { logout, user, isLoggedIn } = useAuth();

      expect(isLoggedIn.value).toBe(true);

      await logout();

      expect(isLoggedIn.value).toBe(false);
      expect(user.value).toBeNull();
    });
  });

  describe('token persistence across page reload', () => {
    it('token persists in storage', async () => {
      // Login
      mockFetchInstance
        .mockResolvedValueOnce({ token: 'persistent-token' }) // login
        .mockResolvedValueOnce({ id: 1 }); // user

      const { login } = useAuth();
      await login({ email: 'test@example.com', password: 'secret' });

      // Simulate "page reload" by clearing state but keeping cookies
      clearStateStore();

      // Token should still be available
      const tokenStorage = useTokenStorage();
      const token = await tokenStorage.get();
      expect(token).toBe('persistent-token');
    });
  });

  describe('error handling', () => {
    it('does not store token on login failure', async () => {
      const error = new Error('Unauthorized') as Error & {
        response: { status: number; _data: unknown };
      };
      error.response = {
        status: 401,
        _data: { message: 'Invalid credentials' },
      };
      mockFetchInstance.mockRejectedValueOnce(error);

      const { login, isLoggedIn } = useAuth();

      await expect(login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow();

      expect(isLoggedIn.value).toBe(false);

      // Token should not be stored
      const storedToken = useCookie('AUTH_TOKEN').value;
      expect(storedToken).toBeFalsy();
    });

    it('handles missing token in response', async () => {
      // Response without token field
      mockFetchInstance
        .mockResolvedValueOnce({ success: true }) // login - no token!
        .mockResolvedValueOnce({ id: 1 }); // user

      const { login, isLoggedIn } = useAuth();
      await login({ email: 'test@example.com', password: 'secret' });

      // Login should still work, but token will be null/undefined
      expect(isLoggedIn.value).toBe(true);

      const storedToken = useCookie('AUTH_TOKEN').value;
      expect(storedToken).toBeFalsy();
    });
  });
});
