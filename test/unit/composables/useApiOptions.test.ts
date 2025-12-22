import { describe, it, expect, beforeEach } from 'vitest';
import { useApiOptions } from '~/src/runtime/composables/useApiOptions';
import { setRuntimeConfigOptions } from '../../mocks/app';

describe('useApiOptions', () => {
  beforeEach(() => {
    setRuntimeConfigOptions({});
  });

  it('returns module options from runtime config', () => {
    const options = useApiOptions();

    expect(options).toBeDefined();
    expect(options.apiBaseURL).toBe('http://localhost:8000');
  });

  it('returns all default options', () => {
    const options = useApiOptions();

    expect(options.authMode).toBe('cookie');
    expect(options.userStateKey).toBe('user');
    expect(options.headers).toEqual({});
  });

  it('returns token options', () => {
    const options = useApiOptions();

    expect(options.token.storageKey).toBe('AUTH_TOKEN');
    expect(options.token.storageType).toBe('cookie');
    expect(options.token.responseKey).toBe('token');
  });

  it('returns csrf options', () => {
    const options = useApiOptions();

    expect(options.csrf.cookieName).toBe('XSRF-TOKEN');
    expect(options.csrf.headerName).toBe('X-XSRF-TOKEN');
  });

  it('returns endpoint options', () => {
    const options = useApiOptions();

    expect(options.endpoints.csrf).toBe('/sanctum/csrf-cookie');
    expect(options.endpoints.login).toBe('/api/login');
    expect(options.endpoints.logout).toBe('/api/logout');
    expect(options.endpoints.user).toBe('/api/user');
  });

  it('returns redirect options', () => {
    const options = useApiOptions();

    expect(options.redirect.intendedEnabled).toBe(false);
    expect(options.redirect.login).toBe('/login');
    expect(options.redirect.postLogin).toBe('/dashboard');
    expect(options.redirect.postLogout).toBe('/login');
  });

  it('returns error messages', () => {
    const options = useApiOptions();

    expect(options.errorMessages.default).toBe('Whoops - something went wrong');
    expect(options.errorMessages.csrf).toBe('CSRF token mismatch');
    expect(options.errorMessages.unauthenticated).toBe('Unauthenticated');
  });

  it('reflects custom options when set', () => {
    setRuntimeConfigOptions({
      apiBaseURL: 'https://api.example.com',
      authMode: 'token',
    });

    const options = useApiOptions();

    expect(options.apiBaseURL).toBe('https://api.example.com');
    expect(options.authMode).toBe('token');
  });
});
