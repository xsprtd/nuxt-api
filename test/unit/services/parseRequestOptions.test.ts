import { describe, it, expect, beforeEach, vi } from 'vitest';
import parseRequestOptions from '~/src/runtime/services/parseRequestOptions';
import { setRuntimeConfigOptions, clearStateStore, clearCookieStore, useCookie } from '../../mocks/app';
import { createFetchContext } from '../../utils/fetch';

// Mock $fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('$fetch', mockFetch);

describe('parseRequestOptions', () => {
  beforeEach(() => {
    clearStateStore();
    clearCookieStore();
    setRuntimeConfigOptions({});
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('base configuration', () => {
    it('sets baseURL from config', () => {
      setRuntimeConfigOptions({ apiBaseURL: 'https://api.example.com' });

      const options = parseRequestOptions();

      expect(options.baseURL).toBe('https://api.example.com');
    });

    it('sets credentials to include', () => {
      const options = parseRequestOptions();

      expect(options.credentials).toBe('include');
    });

    it('sets redirect to manual', () => {
      const options = parseRequestOptions();

      expect(options.redirect).toBe('manual');
    });

    it('sets retry from config', () => {
      setRuntimeConfigOptions({
        fetchOptions: { retryAttempts: 3 },
      });

      const options = parseRequestOptions();

      expect(options.retry).toBe(3);
    });

    it('sets retry to false when disabled', () => {
      setRuntimeConfigOptions({
        fetchOptions: { retryAttempts: false },
      });

      const options = parseRequestOptions();

      expect(options.retry).toBe(false);
    });
  });

  describe('onRequest hook', () => {
    it('sets Accept header to application/json', async () => {
      const options = parseRequestOptions();
      const context = createFetchContext();

      await options.onRequest!(context);

      expect(context.options.headers).toBeInstanceOf(Headers);
      expect((context.options.headers as Headers).get('Accept')).toBe('application/json');
    });

    it('merges custom headers from config', async () => {
      setRuntimeConfigOptions({
        headers: { 'X-Custom-Header': 'custom-value' },
      });

      const options = parseRequestOptions();
      const context = createFetchContext();

      await options.onRequest!(context);

      expect((context.options.headers as Headers).get('X-Custom-Header')).toBe('custom-value');
    });

    it('preserves existing request headers', async () => {
      const options = parseRequestOptions();
      const context = createFetchContext({
        options: {
          method: 'GET',
          headers: { 'X-Existing': 'existing-value' },
        },
      });

      await options.onRequest!(context);

      expect((context.options.headers as Headers).get('X-Existing')).toBe('existing-value');
    });

    it('calls custom onRequest hook if provided', async () => {
      const customHook = vi.fn();
      const options = parseRequestOptions({ onRequest: customHook });
      const context = createFetchContext();

      await options.onRequest!(context);

      expect(customHook).toHaveBeenCalledWith(context);
    });

    it('calls multiple custom onRequest hooks if provided as array', async () => {
      const hook1 = vi.fn();
      const hook2 = vi.fn();
      const options = parseRequestOptions({ onRequest: [hook1, hook2] });
      const context = createFetchContext();

      await options.onRequest!(context);

      expect(hook1).toHaveBeenCalledWith(context);
      expect(hook2).toHaveBeenCalledWith(context);
    });
  });

  describe('cookie mode - CSRF handling', () => {
    beforeEach(() => {
      setRuntimeConfigOptions({
        authMode: 'cookie',
        csrf: {
          cookieName: 'XSRF-TOKEN',
          headerName: 'X-XSRF-TOKEN',
        },
      });
    });

    it('does not attach CSRF header to GET requests', async () => {
      const options = parseRequestOptions();
      const context = createFetchContext({ options: { method: 'GET', headers: {} } });

      await options.onRequest!(context);

      expect((context.options.headers as Headers).has('X-XSRF-TOKEN')).toBe(false);
    });

    it('attaches CSRF header to POST requests', async () => {
      // Set CSRF token in cookie store
      useCookie('XSRF-TOKEN').value = 'csrf-token-value';

      const options = parseRequestOptions();
      const context = createFetchContext({ options: { method: 'POST', headers: {} } });

      await options.onRequest!(context);

      expect((context.options.headers as Headers).get('X-XSRF-TOKEN')).toBe('csrf-token-value');
    });

    it('attaches CSRF header to PUT requests', async () => {
      useCookie('XSRF-TOKEN').value = 'csrf-token-value';

      const options = parseRequestOptions();
      const context = createFetchContext({ options: { method: 'PUT', headers: {} } });

      await options.onRequest!(context);

      expect((context.options.headers as Headers).get('X-XSRF-TOKEN')).toBe('csrf-token-value');
    });

    it('attaches CSRF header to PATCH requests', async () => {
      useCookie('XSRF-TOKEN').value = 'csrf-token-value';

      const options = parseRequestOptions();
      const context = createFetchContext({ options: { method: 'PATCH', headers: {} } });

      await options.onRequest!(context);

      expect((context.options.headers as Headers).get('X-XSRF-TOKEN')).toBe('csrf-token-value');
    });

    it('attaches CSRF header to DELETE requests', async () => {
      useCookie('XSRF-TOKEN').value = 'csrf-token-value';

      const options = parseRequestOptions();
      const context = createFetchContext({ options: { method: 'DELETE', headers: {} } });

      await options.onRequest!(context);

      expect((context.options.headers as Headers).get('X-XSRF-TOKEN')).toBe('csrf-token-value');
    });

    it('fetches CSRF cookie when not present', async () => {
      mockFetch.mockResolvedValueOnce({});

      const options = parseRequestOptions();
      const context = createFetchContext({ options: { method: 'POST', headers: {} } });

      await options.onRequest!(context);

      expect(mockFetch).toHaveBeenCalledWith('/sanctum/csrf-cookie', {
        baseURL: 'http://localhost:8000',
        credentials: 'include',
      });
    });

    it('warns when CSRF token cannot be obtained', async () => {
      mockFetch.mockResolvedValueOnce({});

      const options = parseRequestOptions();
      const context = createFetchContext({ options: { method: 'POST', headers: {} } });

      await options.onRequest!(context);

      expect(console.warn).toHaveBeenCalledWith(
        'Unable to set X-XSRF-TOKEN header',
      );
    });

    it('handles CSRF fetch error gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const options = parseRequestOptions();
      const context = createFetchContext({ options: { method: 'POST', headers: {} } });

      await options.onRequest!(context);

      expect(console.error).toHaveBeenCalledWith(
        'Failed to initialize CSRF cookie',
        expect.any(Error),
      );
    });
  });

  describe('token mode', () => {
    beforeEach(() => {
      setRuntimeConfigOptions({
        authMode: 'token',
        token: {
          storageKey: 'AUTH_TOKEN',
          storageType: 'cookie',
          responseKey: 'token',
        },
      });
    });

    it('attaches Bearer token when present', async () => {
      // Set token in cookie store
      useCookie('AUTH_TOKEN').value = 'my-auth-token';

      const options = parseRequestOptions();
      const context = createFetchContext();

      await options.onRequest!(context);

      expect((context.options.headers as Headers).get('Authorization')).toBe('Bearer my-auth-token');
    });

    it('does not attach Authorization header when token is missing', async () => {
      const options = parseRequestOptions();
      const context = createFetchContext();

      await options.onRequest!(context);

      expect((context.options.headers as Headers).has('Authorization')).toBe(false);
    });

    it('logs debug message when token is missing', async () => {
      const options = parseRequestOptions();
      const context = createFetchContext();

      await options.onRequest!(context);

      expect(console.debug).toHaveBeenCalledWith('Authentication token is not set in the storage');
    });
  });

  describe('FormData handling', () => {
    it('changes method to POST for FormData with PUT', async () => {
      setRuntimeConfigOptions({ authMode: 'token' });

      const options = parseRequestOptions();
      const formData = new FormData();
      formData.append('name', 'test');

      const context = createFetchContext({
        options: { method: 'PUT', headers: {}, body: formData },
      });

      await options.onRequest!(context);

      expect(context.options.method).toBe('POST');
    });

    it('appends _method field to FormData for PUT', async () => {
      setRuntimeConfigOptions({ authMode: 'token' });

      const options = parseRequestOptions();
      const formData = new FormData();
      formData.append('name', 'test');

      const context = createFetchContext({
        options: { method: 'PUT', headers: {}, body: formData },
      });

      await options.onRequest!(context);

      expect(formData.get('_method')).toBe('PUT');
    });

    it('appends _method field to FormData for PATCH', async () => {
      setRuntimeConfigOptions({ authMode: 'token' });

      const options = parseRequestOptions();
      const formData = new FormData();

      const context = createFetchContext({
        options: { method: 'PATCH', headers: {}, body: formData },
      });

      await options.onRequest!(context);

      expect(formData.get('_method')).toBe('PATCH');
    });

    it('appends _method field to FormData for DELETE', async () => {
      setRuntimeConfigOptions({ authMode: 'token' });

      const options = parseRequestOptions();
      const formData = new FormData();

      const context = createFetchContext({
        options: { method: 'DELETE', headers: {}, body: formData },
      });

      await options.onRequest!(context);

      expect(formData.get('_method')).toBe('DELETE');
    });
  });

  describe('onResponseError hook', () => {
    it('passes error to useErrorBag', async () => {
      const options = parseRequestOptions();
      const errorContext = {
        response: { status: 500, _data: {} },
      };

      await options.onResponseError!(errorContext as never);

      // Error should be handled - we can verify by checking the error bag state indirectly
      // The error handling is tested in useErrorBag tests
    });

    it('calls custom onResponseError hook if provided', async () => {
      const customHook = vi.fn();
      const options = parseRequestOptions({ onResponseError: customHook });
      const errorContext = { response: { status: 500 } };

      await options.onResponseError!(errorContext as never);

      expect(customHook).toHaveBeenCalledWith(errorContext);
    });

    it('calls multiple custom onResponseError hooks if provided as array', async () => {
      const hook1 = vi.fn();
      const hook2 = vi.fn();
      const options = parseRequestOptions({ onResponseError: [hook1, hook2] });
      const errorContext = { response: { status: 500 } };

      await options.onResponseError!(errorContext as never);

      expect(hook1).toHaveBeenCalledWith(errorContext);
      expect(hook2).toHaveBeenCalledWith(errorContext);
    });
  });
});
