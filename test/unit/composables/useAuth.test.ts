import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuth } from '~/src/runtime/composables/useAuth';
import {
  clearStateStore,
  clearCookieStore,
  setRuntimeConfigOptions,
  navigateTo,
  useRoute,
  useCookie,
} from '../../mocks/app';

// Mock $fetch and $fetch.create
const mockFetchInstance = vi.fn();
const mockFetch = Object.assign(vi.fn(), {
  create: vi.fn(() => mockFetchInstance),
});
vi.stubGlobal('$fetch', mockFetch);

interface TestUser {
  id: number;
  name: string;
  email: string;
}

interface LoginResponse {
  token?: string;
  user?: TestUser;
}

describe('useAuth', () => {
  beforeEach(() => {
    clearStateStore();
    clearCookieStore();
    setRuntimeConfigOptions({});
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});

    // Reset useRoute mock
    useRoute.mockReturnValue({
      path: '/login',
      fullPath: '/login',
      query: {},
      params: {},
      meta: {},
    });
  });

  describe('initial state', () => {
    it('returns user ref with initial value of null', () => {
      const { user } = useAuth<TestUser>();

      expect(user.value).toBeNull();
    });

    it('returns isLoggedIn as false when user is null', () => {
      const { isLoggedIn } = useAuth();

      expect(isLoggedIn.value).toBe(false);
    });

    it('returns processing ref with initial value of false', () => {
      const { processing } = useAuth();

      expect(processing.value).toBe(false);
    });

    it('returns errorBag with null message', () => {
      const { errorBag } = useAuth();

      expect(errorBag.message.value).toBeNull();
    });
  });

  describe('login()', () => {
    beforeEach(() => {
      setRuntimeConfigOptions({
        authMode: 'cookie',
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
    });

    it('calls login endpoint with credentials', async () => {
      mockFetchInstance
        .mockResolvedValueOnce({}) // login
        .mockResolvedValueOnce({ id: 1, name: 'John' }); // getAuthUser

      const { login } = useAuth();
      await login({ email: 'john@example.com', password: 'secret' });

      expect(mockFetchInstance).toHaveBeenCalledWith(
        '/api/login',
        expect.objectContaining({
          method: 'post',
          body: { email: 'john@example.com', password: 'secret' },
        }),
      );
    });

    it('refreshes user after successful login', async () => {
      const userData = { id: 1, name: 'John', email: 'john@example.com' };
      mockFetchInstance
        .mockResolvedValueOnce({}) // login
        .mockResolvedValueOnce(userData); // getAuthUser

      const { login, user } = useAuth<TestUser>();
      await login({ email: 'john@example.com', password: 'secret' });

      expect(user.value).toEqual(userData);
    });

    it('sets isLoggedIn to true after successful login', async () => {
      mockFetchInstance
        .mockResolvedValueOnce({}) // login
        .mockResolvedValueOnce({ id: 1 }); // getAuthUser

      const { login, isLoggedIn } = useAuth();
      expect(isLoggedIn.value).toBe(false);

      await login({ email: 'test@example.com', password: 'secret' });

      expect(isLoggedIn.value).toBe(true);
    });

    it('navigates to postLogin path after successful login', async () => {
      mockFetchInstance
        .mockResolvedValueOnce({}) // login
        .mockResolvedValueOnce({ id: 1 }); // getAuthUser

      const { login } = useAuth();
      await login({ email: 'test@example.com', password: 'secret' });

      expect(navigateTo).toHaveBeenCalledWith('/dashboard');
    });

    it('does not navigate when already on postLogin path', async () => {
      useRoute.mockReturnValue({
        path: '/dashboard',
        fullPath: '/dashboard',
        query: {},
        params: {},
        meta: {},
      });

      mockFetchInstance
        .mockResolvedValueOnce({}) // login
        .mockResolvedValueOnce({ id: 1 }); // getAuthUser

      const { login } = useAuth();
      await login({ email: 'test@example.com', password: 'secret' });

      expect(navigateTo).not.toHaveBeenCalled();
    });

    it('does not navigate when postLogin is false', async () => {
      setRuntimeConfigOptions({
        authMode: 'cookie',
        endpoints: {
          csrf: '/sanctum/csrf-cookie',
          login: '/api/login',
          logout: '/api/logout',
          user: '/api/user',
        },
        redirect: {
          intendedEnabled: false,
          login: '/login',
          postLogin: false,
          postLogout: '/login',
        },
      });

      mockFetchInstance
        .mockResolvedValueOnce({}) // login
        .mockResolvedValueOnce({ id: 1 }); // getAuthUser

      const { login } = useAuth();
      await login({ email: 'test@example.com', password: 'secret' });

      expect(navigateTo).not.toHaveBeenCalled();
    });

    it('invokes callback with response and user', async () => {
      const loginResponse = { success: true };
      const userData = { id: 1, name: 'John' };
      mockFetchInstance
        .mockResolvedValueOnce(loginResponse) // login
        .mockResolvedValueOnce(userData); // getAuthUser

      const callback = vi.fn();
      const { login } = useAuth<TestUser>();
      await login({ email: 'test@example.com', password: 'secret' }, {}, callback);

      expect(callback).toHaveBeenCalledWith(loginResponse, userData);
      expect(navigateTo).not.toHaveBeenCalled(); // callback prevents redirect
    });

    it('redirects to intended route when enabled', async () => {
      setRuntimeConfigOptions({
        authMode: 'cookie',
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

      useRoute.mockReturnValue({
        path: '/login',
        fullPath: '/login?redirect=/profile',
        query: { redirect: '/profile' },
        params: {},
        meta: {},
      });

      mockFetchInstance
        .mockResolvedValueOnce({}) // login
        .mockResolvedValueOnce({ id: 1 }); // getAuthUser

      const { login } = useAuth();
      await login({ email: 'test@example.com', password: 'secret' });

      expect(navigateTo).toHaveBeenCalledWith('/profile');
    });

    it('does not call login if already logged in', async () => {
      // Set up a logged-in user first
      mockFetchInstance
        .mockResolvedValueOnce({}) // first login
        .mockResolvedValueOnce({ id: 1, name: 'John' }); // getAuthUser

      const { login, isLoggedIn } = useAuth();
      await login({ email: 'test@example.com', password: 'secret' });

      expect(isLoggedIn.value).toBe(true);
      vi.clearAllMocks();

      // Try to login again
      await login({ email: 'other@example.com', password: 'secret' });

      // Should redirect to postLogin instead of calling login endpoint
      expect(mockFetchInstance).not.toHaveBeenCalled();
      expect(navigateTo).toHaveBeenCalledWith('/dashboard');
    });

    it('handles login error', async () => {
      const error = new Error('Invalid credentials') as Error & {
        response: { status: number; _data: unknown };
      };
      error.response = {
        status: 422,
        _data: {
          message: 'Invalid credentials',
          errors: { email: ['These credentials do not match our records.'] },
        },
      };
      mockFetchInstance.mockRejectedValueOnce(error);

      const { login, errorBag } = useAuth();

      await expect(login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow();

      expect(errorBag.message.value).toBe('Invalid credentials');
      expect(errorBag.errors.value).toEqual({
        email: ['These credentials do not match our records.'],
      });
    });
  });

  describe('login() - token mode', () => {
    beforeEach(() => {
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
    });

    it('extracts and stores token from login response', async () => {
      mockFetchInstance
        .mockResolvedValueOnce({ token: 'my-auth-token' }) // login
        .mockResolvedValueOnce({ id: 1 }); // getAuthUser

      const { login } = useAuth();
      await login({ email: 'test@example.com', password: 'secret' });

      // Verify token was stored
      const storedToken = useCookie('AUTH_TOKEN').value;
      expect(storedToken).toBe('my-auth-token');
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

      mockFetchInstance
        .mockResolvedValueOnce({ data: { access_token: 'nested-token' } }) // login
        .mockResolvedValueOnce({ id: 1 }); // getAuthUser

      const { login } = useAuth();
      await login({ email: 'test@example.com', password: 'secret' });

      const storedToken = useCookie('AUTH_TOKEN').value;
      expect(storedToken).toBe('nested-token');
    });
  });

  describe('logout()', () => {
    beforeEach(() => {
      setRuntimeConfigOptions({
        authMode: 'cookie',
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
    });

    it('calls logout endpoint', async () => {
      // First login
      mockFetchInstance
        .mockResolvedValueOnce({}) // login
        .mockResolvedValueOnce({ id: 1 }); // getAuthUser

      const { login, logout, isLoggedIn } = useAuth();
      await login({ email: 'test@example.com', password: 'secret' });

      expect(isLoggedIn.value).toBe(true);
      vi.clearAllMocks();

      // Now logout
      mockFetchInstance.mockResolvedValueOnce({}); // logout

      useRoute.mockReturnValue({
        path: '/dashboard',
        fullPath: '/dashboard',
        query: {},
        params: {},
        meta: {},
      });

      await logout();

      expect(mockFetchInstance).toHaveBeenCalledWith(
        '/api/logout',
        expect.objectContaining({ method: 'post' }),
      );
    });

    it('clears user state', async () => {
      // First login
      mockFetchInstance
        .mockResolvedValueOnce({}) // login
        .mockResolvedValueOnce({ id: 1, name: 'John' }); // getAuthUser

      const { login, logout, user, isLoggedIn } = useAuth<TestUser>();
      await login({ email: 'test@example.com', password: 'secret' });

      expect(user.value).not.toBeNull();
      expect(isLoggedIn.value).toBe(true);

      // Now logout
      mockFetchInstance.mockResolvedValueOnce({}); // logout

      useRoute.mockReturnValue({
        path: '/dashboard',
        fullPath: '/dashboard',
        query: {},
        params: {},
        meta: {},
      });

      await logout();

      expect(user.value).toBeNull();
      expect(isLoggedIn.value).toBe(false);
    });

    it('navigates to postLogout path', async () => {
      // First login
      mockFetchInstance
        .mockResolvedValueOnce({}) // login
        .mockResolvedValueOnce({ id: 1 }); // getAuthUser

      const { login, logout } = useAuth();
      await login({ email: 'test@example.com', password: 'secret' });
      vi.clearAllMocks();

      // Now logout
      mockFetchInstance.mockResolvedValueOnce({}); // logout

      useRoute.mockReturnValue({
        path: '/dashboard',
        fullPath: '/dashboard',
        query: {},
        params: {},
        meta: {},
      });

      await logout();

      expect(navigateTo).toHaveBeenCalledWith('/login');
    });

    it('does not navigate when already on postLogout path', async () => {
      // First login
      mockFetchInstance
        .mockResolvedValueOnce({}) // login
        .mockResolvedValueOnce({ id: 1 }); // getAuthUser

      const { login, logout } = useAuth();
      await login({ email: 'test@example.com', password: 'secret' });
      vi.clearAllMocks();

      // Now logout (already on /login)
      mockFetchInstance.mockResolvedValueOnce({}); // logout

      useRoute.mockReturnValue({
        path: '/login',
        fullPath: '/login',
        query: {},
        params: {},
        meta: {},
      });

      await logout();

      expect(navigateTo).not.toHaveBeenCalled();
    });

    it('invokes callback instead of redirect', async () => {
      // First login
      mockFetchInstance
        .mockResolvedValueOnce({}) // login
        .mockResolvedValueOnce({ id: 1 }); // getAuthUser

      const { login, logout } = useAuth();
      await login({ email: 'test@example.com', password: 'secret' });
      vi.clearAllMocks();

      // Now logout with callback
      mockFetchInstance.mockResolvedValueOnce({}); // logout

      const callback = vi.fn();
      await logout(callback);

      expect(callback).toHaveBeenCalled();
      expect(navigateTo).not.toHaveBeenCalled();
    });

    it('does nothing if not logged in', async () => {
      const { logout, isLoggedIn } = useAuth();

      expect(isLoggedIn.value).toBe(false);

      await logout();

      expect(mockFetchInstance).not.toHaveBeenCalled();
      expect(navigateTo).not.toHaveBeenCalled();
    });
  });

  describe('refreshUser()', () => {
    beforeEach(() => {
      setRuntimeConfigOptions({
        authMode: 'cookie',
        endpoints: {
          csrf: '/sanctum/csrf-cookie',
          login: '/api/login',
          logout: '/api/logout',
          user: '/api/user',
        },
      });
    });

    it('fetches and updates user state', async () => {
      const userData = { id: 1, name: 'John', email: 'john@example.com' };
      mockFetchInstance.mockResolvedValueOnce(userData);

      const { refreshUser, user } = useAuth<TestUser>();

      expect(user.value).toBeNull();

      await refreshUser();

      expect(user.value).toEqual(userData);
    });

    it('clears user on error', async () => {
      // First set a user
      mockFetchInstance.mockResolvedValueOnce({ id: 1, name: 'John' });

      const { refreshUser, user } = useAuth<TestUser>();
      await refreshUser();

      expect(user.value).not.toBeNull();

      // Now simulate an error (e.g., token expired)
      mockFetchInstance.mockRejectedValueOnce(new Error('Unauthorized'));

      await refreshUser();

      expect(user.value).toBeNull();
    });

    it('extracts user with configured response key', async () => {
      setRuntimeConfigOptions({
        authMode: 'cookie',
        userResponseKey: 'data.user',
        endpoints: {
          csrf: '/sanctum/csrf-cookie',
          login: '/api/login',
          logout: '/api/logout',
          user: '/api/user',
        },
      });

      const response = {
        data: {
          user: { id: 1, name: 'John', email: 'john@example.com' },
        },
      };
      mockFetchInstance.mockResolvedValueOnce(response);

      const { refreshUser, user } = useAuth<TestUser>();
      await refreshUser();

      expect(user.value).toEqual({ id: 1, name: 'John', email: 'john@example.com' });
    });
  });

  describe('isLoggedIn computed', () => {
    it('returns true when user is set', async () => {
      mockFetchInstance.mockResolvedValueOnce({ id: 1 });

      const { refreshUser, isLoggedIn } = useAuth();

      expect(isLoggedIn.value).toBe(false);

      await refreshUser();

      expect(isLoggedIn.value).toBe(true);
    });

    it('returns false when user is null', () => {
      const { isLoggedIn } = useAuth();

      expect(isLoggedIn.value).toBe(false);
    });

    it('updates reactively when user changes', async () => {
      mockFetchInstance.mockResolvedValueOnce({ id: 1 });

      const { refreshUser, user, isLoggedIn } = useAuth();

      expect(isLoggedIn.value).toBe(false);

      await refreshUser();
      expect(isLoggedIn.value).toBe(true);

      user.value = null;
      expect(isLoggedIn.value).toBe(false);
    });
  });
});
