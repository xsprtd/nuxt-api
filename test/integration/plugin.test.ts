import { describe, it, expect, beforeEach, vi } from 'vitest';
import plugin from '~/src/runtime/plugin';
import { clearStateStore, clearCookieStore, setRuntimeConfigOptions, useState } from '../mocks/app';

// Mock $fetch and $fetch.create
const mockFetchInstance = vi.fn();
const mockFetch = Object.assign(vi.fn(), {
  create: vi.fn(() => mockFetchInstance),
});
vi.stubGlobal('$fetch', mockFetch);

describe('plugin initialization', () => {
  beforeEach(() => {
    clearStateStore();
    clearCookieStore();
    setRuntimeConfigOptions({
      endpoints: {
        csrf: '/sanctum/csrf-cookie',
        login: '/api/login',
        logout: '/api/logout',
        user: '/api/user',
      },
    });
    vi.clearAllMocks();
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  it('fetches authenticated user on initialization', async () => {
    const userData = { id: 1, name: 'John', email: 'john@example.com' };
    mockFetchInstance.mockResolvedValueOnce(userData);

    await plugin();

    expect(mockFetchInstance).toHaveBeenCalledWith('/api/user', expect.any(Object));

    // Verify user state is populated
    const user = useState('user');
    expect(user.value).toEqual(userData);
  });

  it('handles fetch error gracefully', async () => {
    mockFetchInstance.mockRejectedValueOnce(new Error('Unauthorized'));

    await plugin();

    expect(console.debug).toHaveBeenCalledWith(
      'Failed to fetch authenticated user:',
      expect.any(Error),
    );

    // User should remain null
    const user = useState('user');
    expect(user.value).toBeNull();
  });

  it('does not fetch user if already set', async () => {
    // Pre-set user state
    useState('user', () => ({ id: 1, name: 'Existing User' }));

    await plugin();

    expect(mockFetchInstance).not.toHaveBeenCalled();
  });

  it('extracts user with configured response key', async () => {
    setRuntimeConfigOptions({
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
        user: { id: 1, name: 'John' },
      },
    };
    mockFetchInstance.mockResolvedValueOnce(response);

    await plugin();

    const user = useState('user');
    expect(user.value).toEqual({ id: 1, name: 'John' });
  });
});
