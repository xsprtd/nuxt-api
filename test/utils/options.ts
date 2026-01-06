import type { ModuleOptions } from '../../src/runtime/types/ModuleOptions';

export const createDefaultOptions = (overrides?: Partial<ModuleOptions>): ModuleOptions => ({
  apiBaseURL: 'http://localhost:8000',
  authMode: 'cookie',
  userStateKey: 'user',
  headers: {},
  token: {
    storageKey: 'AUTH_TOKEN',
    storageType: 'cookie',
    responseKey: 'token',
  },
  fetchOptions: {
    retryAttempts: false,
  },
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
    intendedEnabled: false,
    login: '/login',
    postLogin: '/dashboard',
    postLogout: '/login',
  },
  middlewareNames: {
    auth: false,
    guest: false,
  },
  errorMessages: {
    default: 'Whoops - something went wrong',
    csrf: 'CSRF token mismatch',
    unauthenticated: 'Unauthenticated',
  },
  ...overrides,
});
