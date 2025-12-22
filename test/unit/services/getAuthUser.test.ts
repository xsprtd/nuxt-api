import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAuthUser } from '~/src/runtime/services/getAuthUser';
import { setRuntimeConfigOptions, clearStateStore, clearCookieStore } from '../../mocks/app';

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

describe('getAuthUser', () => {
  beforeEach(() => {
    clearStateStore();
    clearCookieStore();
    setRuntimeConfigOptions({});
    vi.clearAllMocks();
  });

  it('fetches user from configured endpoint', async () => {
    setRuntimeConfigOptions({
      endpoints: {
        csrf: '/sanctum/csrf-cookie',
        login: '/api/login',
        logout: '/api/logout',
        user: '/api/user',
      },
    });

    mockFetchInstance.mockResolvedValueOnce({ id: 1, name: 'John' });

    await getAuthUser();

    expect(mockFetchInstance).toHaveBeenCalledWith('/api/user', expect.any(Object));
  });

  it('returns user data when no response key is configured', async () => {
    const userData = { id: 1, name: 'John', email: 'john@example.com' };
    mockFetchInstance.mockResolvedValueOnce(userData);

    const user = await getAuthUser<TestUser>();

    expect(user).toEqual(userData);
  });

  it('extracts user with simple response key', async () => {
    setRuntimeConfigOptions({
      userResponseKey: 'user',
    });

    const response = {
      user: { id: 1, name: 'John', email: 'john@example.com' },
    };
    mockFetchInstance.mockResolvedValueOnce(response);

    const user = await getAuthUser<TestUser>();

    expect(user).toEqual({ id: 1, name: 'John', email: 'john@example.com' });
  });

  it('extracts user with nested response key (dot notation)', async () => {
    setRuntimeConfigOptions({
      userResponseKey: 'data.user',
    });

    const response = {
      data: {
        user: { id: 1, name: 'John', email: 'john@example.com' },
      },
    };
    mockFetchInstance.mockResolvedValueOnce(response);

    const user = await getAuthUser<TestUser>();

    expect(user).toEqual({ id: 1, name: 'John', email: 'john@example.com' });
  });

  it('extracts user with deeply nested response key', async () => {
    setRuntimeConfigOptions({
      userResponseKey: 'data.attributes.user',
    });

    const response = {
      data: {
        attributes: {
          user: { id: 1, name: 'John' },
        },
      },
    };
    mockFetchInstance.mockResolvedValueOnce(response);

    const user = await getAuthUser();

    expect(user).toEqual({ id: 1, name: 'John' });
  });

  it('returns null when response key path does not exist', async () => {
    setRuntimeConfigOptions({
      userResponseKey: 'data.user',
    });

    const response = { other: 'data' };
    mockFetchInstance.mockResolvedValueOnce(response);

    const user = await getAuthUser();

    expect(user).toBeUndefined();
  });

  it('handles null userResponseKey', async () => {
    setRuntimeConfigOptions({
      userResponseKey: null,
    });

    const userData = { id: 1, name: 'John' };
    mockFetchInstance.mockResolvedValueOnce(userData);

    const user = await getAuthUser();

    expect(user).toEqual(userData);
  });

  it('uses custom user endpoint from config', async () => {
    setRuntimeConfigOptions({
      endpoints: {
        csrf: '/csrf',
        login: '/login',
        logout: '/logout',
        user: '/custom/current-user',
      },
    });

    mockFetchInstance.mockResolvedValueOnce({ id: 1 });

    await getAuthUser();

    expect(mockFetchInstance).toHaveBeenCalledWith('/custom/current-user', expect.any(Object));
  });
});
