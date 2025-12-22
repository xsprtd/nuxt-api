import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTokenStorage } from '../../../src/runtime/composables/useTokenStorage';
import { clearStateStore, clearCookieStore, setRuntimeConfigOptions } from '../../mocks/app';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'window', {
  value: { localStorage: localStorageMock },
  writable: true,
});

describe('useTokenStorage', () => {
  beforeEach(() => {
    clearStateStore();
    clearCookieStore();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('cookie provider (default)', () => {
    beforeEach(() => {
      setRuntimeConfigOptions({
        token: {
          storageKey: 'AUTH_TOKEN',
          storageType: 'cookie',
          responseKey: 'token',
        },
      });
    });

    it('returns undefined when no token is stored', async () => {
      const storage = useTokenStorage();

      const token = await storage.get();

      expect(token).toBeUndefined();
    });

    it('stores and retrieves token', async () => {
      const storage = useTokenStorage();

      await storage.set('my-secret-token');
      const token = await storage.get();

      expect(token).toBe('my-secret-token');
    });

    it('removes token when set to undefined', async () => {
      const storage = useTokenStorage();

      await storage.set('my-secret-token');
      await storage.set(undefined);
      const token = await storage.get();

      expect(token).toBeUndefined();
    });

    it('removes token when set to null', async () => {
      const storage = useTokenStorage();

      await storage.set('my-secret-token');
      await storage.set(null);
      const token = await storage.get();

      // null gets coerced, token state becomes undefined
      expect(token).toBeFalsy();
    });

    it('uses configured storage key', async () => {
      setRuntimeConfigOptions({
        token: {
          storageKey: 'CUSTOM_TOKEN_KEY',
          storageType: 'cookie',
          responseKey: 'token',
        },
      });

      const storage = useTokenStorage();
      await storage.set('custom-token');

      // Create new instance to verify it uses same key
      const storage2 = useTokenStorage();
      const token = await storage2.get();

      expect(token).toBe('custom-token');
    });
  });

  describe('localStorage provider', () => {
    beforeEach(() => {
      setRuntimeConfigOptions({
        token: {
          storageKey: 'AUTH_TOKEN',
          storageType: 'localStorage',
          responseKey: 'token',
        },
      });
    });

    it('returns undefined when no token is stored', async () => {
      const storage = useTokenStorage();

      const token = await storage.get();

      expect(token).toBeUndefined();
    });

    it('stores token in localStorage', async () => {
      const storage = useTokenStorage();

      await storage.set('local-storage-token');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('AUTH_TOKEN', 'local-storage-token');
    });

    it('retrieves token from localStorage', async () => {
      localStorageMock.getItem.mockReturnValueOnce('stored-token');

      const storage = useTokenStorage();
      const token = await storage.get();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('AUTH_TOKEN');
      expect(token).toBe('stored-token');
    });

    it('removes token from localStorage when set to undefined', async () => {
      const storage = useTokenStorage();

      await storage.set('token-to-remove');
      await storage.set(undefined);

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('AUTH_TOKEN');
    });

    it('removes token from localStorage when set to empty string', async () => {
      const storage = useTokenStorage();

      await storage.set('');

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('AUTH_TOKEN');
    });
  });

  describe('shared state', () => {
    it('shares token state between instances', async () => {
      setRuntimeConfigOptions({
        token: {
          storageKey: 'AUTH_TOKEN',
          storageType: 'cookie',
          responseKey: 'token',
        },
      });

      const storage1 = useTokenStorage();
      const storage2 = useTokenStorage();

      await storage1.set('shared-token');
      const token = await storage2.get();

      expect(token).toBe('shared-token');
    });
  });
});
