import { useApiOptions } from './useApiOptions';
import { unref } from '#imports';
import { useCookie, useState, useNuxtApp } from '#app';

const cookieProvider = {
  get(tokenKey: string) {
    const cookie = useCookie(tokenKey, { readonly: true });
    return unref(cookie.value);
  },

  set(tokenKey: string, token?: string) {
    const cookie = useCookie(tokenKey, { secure: true });
    cookie.value = token;
  },
};

const localStorageProvider = {
  get(tokenKey: string) {
    if (import.meta.server) {
      return undefined;
    }
    return window.localStorage.getItem(tokenKey) ?? undefined;
  },

  set(tokenKey: string, token?: string) {
    if (import.meta.server) {
      return;
    }

    if (!token) {
      window.localStorage.removeItem(tokenKey);
      return;
    }

    window.localStorage.setItem(tokenKey, token);
  },
};

export function useTokenStorage(): {
  get(): Promise<string | undefined>;
  set(tokenData?: string | null): Promise<void>;
} {
  const { token } = useApiOptions();
  const nuxtApp = useNuxtApp();

  const provider
    = token.storageType === 'localStorage'
      ? localStorageProvider
      : cookieProvider;

  const tokenState = useState<string | undefined>(
    token.storageKey,
    () => undefined,
  );

  return {
    get: async () => {
      return nuxtApp.runWithContext(() => {
        return provider.get(token.storageKey) ?? tokenState.value;
      });
    },

    set: async (tokenData?: string) => {
      await nuxtApp.runWithContext(() => {
        provider.set(token.storageKey, tokenData);
        tokenState.value = tokenData;
      });
    },
  };
}
