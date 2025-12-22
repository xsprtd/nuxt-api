import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useErrorBag } from '~/src/runtime/composables/useErrorBag';
import { clearStateStore, setRuntimeConfigOptions } from '../../mocks/app';

const createResponseError = (status: number, data?: unknown) => {
  const error = new Error('Request failed') as Error & {
    response: { status: number; _data: unknown };
  };
  error.response = { status, _data: data };
  return error;
};

describe('useErrorBag', () => {
  beforeEach(() => {
    clearStateStore();
    setRuntimeConfigOptions({});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('initial state', () => {
    it('has null message initially', () => {
      const { message } = useErrorBag();

      expect(message.value).toBeNull();
    });

    it('has null errors initially', () => {
      const { errors } = useErrorBag();

      expect(errors.value).toBeNull();
    });
  });

  describe('handle()', () => {
    it('does nothing when error is undefined', () => {
      const { message, handle } = useErrorBag();

      handle(undefined);

      expect(message.value).toBeNull();
    });

    describe('422 validation error', () => {
      it('extracts message from response', () => {
        const { message, handle } = useErrorBag();
        const error = createResponseError(422, {
          message: 'The given data was invalid.',
          errors: { email: ['Email is required'] },
        });

        handle(error);

        expect(message.value).toBe('The given data was invalid.');
      });

      it('extracts errors from response', () => {
        const { errors, handle } = useErrorBag();
        const error = createResponseError(422, {
          message: 'Validation failed',
          errors: {
            email: ['Email is required', 'Email must be valid'],
            password: ['Password is required'],
          },
        });

        handle(error);

        expect(errors.value).toEqual({
          email: ['Email is required', 'Email must be valid'],
          password: ['Password is required'],
        });
      });

      it('uses default message when response message is missing', () => {
        const { message, handle } = useErrorBag();
        const error = createResponseError(422, { errors: {} });

        handle(error);

        expect(message.value).toBe('Whoops - something went wrong');
      });
    });

    describe('419 CSRF error', () => {
      it('sets CSRF error message', () => {
        const { message, handle } = useErrorBag();
        const error = createResponseError(419, {});

        handle(error);

        expect(message.value).toBe('CSRF token mismatch');
      });

      it('logs warning to console', () => {
        const { handle } = useErrorBag();
        const error = createResponseError(419, {});

        handle(error);

        expect(console.warn).toHaveBeenCalled();
      });
    });

    describe('401 unauthenticated error', () => {
      it('sets unauthenticated message', () => {
        const { message, handle } = useErrorBag();
        const error = createResponseError(401, {});

        handle(error);

        expect(message.value).toBe('Unauthenticated');
      });

      it('clears user state when user is set', async () => {
        // Set user state through the mock's useState
        const { useState } = await import('../../mocks/app');
        const user = useState('user', () => ({ id: 1, name: 'John' }));
        expect(user.value).toEqual({ id: 1, name: 'John' });

        const { handle } = useErrorBag();
        const error = createResponseError(401, {});
        handle(error);

        expect(user.value).toBeNull();
      });
    });

    describe('generic error', () => {
      it('sets error message from Error object', () => {
        const { message, handle } = useErrorBag();
        const error = new Error('Network error');

        handle(error);

        expect(message.value).toBe('Network error');
      });

      it('uses default message when error has no message', () => {
        const { message, handle } = useErrorBag();
        const error = createResponseError(500, {});
        error.message = '';

        handle(error);

        expect(message.value).toBe('Whoops - something went wrong');
      });

      it('logs warning to console', () => {
        const { handle } = useErrorBag();
        const error = new Error('Something went wrong');

        handle(error);

        expect(console.warn).toHaveBeenCalled();
      });
    });
  });

  describe('has()', () => {
    it('returns false when no errors exist', () => {
      const { has } = useErrorBag();

      expect(has('email')).toBe(false);
    });

    it('returns true when error exists for key', () => {
      const { has, handle } = useErrorBag();
      const error = createResponseError(422, {
        message: 'Validation failed',
        errors: { email: ['Email is required'] },
      });

      handle(error);

      expect(has('email')).toBe(true);
    });

    it('returns false when error does not exist for key', () => {
      const { has, handle } = useErrorBag();
      const error = createResponseError(422, {
        message: 'Validation failed',
        errors: { email: ['Email is required'] },
      });

      handle(error);

      expect(has('password')).toBe(false);
    });
  });

  describe('get()', () => {
    it('returns first error message for key', () => {
      const { get, handle } = useErrorBag();
      const error = createResponseError(422, {
        message: 'Validation failed',
        errors: { email: ['Email is required', 'Email must be valid'] },
      });

      handle(error);

      expect(get('email')).toBe('Email is required');
    });

    it('returns undefined by default when key does not exist', () => {
      const { get } = useErrorBag();

      expect(get('email')).toBeUndefined();
    });

    it('returns custom default value when key does not exist', () => {
      const { get } = useErrorBag();

      expect(get('email', 'No error')).toBe('No error');
    });

    it('returns default value when errors is null', () => {
      const { get } = useErrorBag();

      expect(get('email', null)).toBeNull();
    });
  });

  describe('reset()', () => {
    it('clears message', () => {
      const { message, handle, reset } = useErrorBag();
      const error = createResponseError(422, { message: 'Error', errors: {} });

      handle(error);
      expect(message.value).not.toBeNull();

      reset();
      expect(message.value).toBeNull();
    });

    it('clears errors', () => {
      const { errors, handle, reset } = useErrorBag();
      const error = createResponseError(422, {
        message: 'Error',
        errors: { email: ['Required'] },
      });

      handle(error);
      expect(errors.value).not.toBeNull();

      reset();
      expect(errors.value).toBeNull();
    });
  });

  describe('custom error messages', () => {
    it('uses custom default message from config', () => {
      setRuntimeConfigOptions({
        errorMessages: {
          default: 'Custom default error',
          csrf: 'Custom CSRF error',
          unauthenticated: 'Custom auth error',
        },
      });

      const { message, handle } = useErrorBag();
      const error = createResponseError(500, {});
      error.message = '';

      handle(error);

      expect(message.value).toBe('Custom default error');
    });

    it('uses custom CSRF message from config', () => {
      setRuntimeConfigOptions({
        errorMessages: {
          default: 'Custom default error',
          csrf: 'Custom CSRF error',
          unauthenticated: 'Custom auth error',
        },
      });

      const { message, handle } = useErrorBag();
      const error = createResponseError(419, {});

      handle(error);

      expect(message.value).toBe('Custom CSRF error');
    });
  });
});
