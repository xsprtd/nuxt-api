import { ref, type Ref } from 'vue';
import { vi } from 'vitest';
import type { ModuleOptions } from '../../src/runtime/types/ModuleOptions';
import { MODULE_CONFIG_KEY } from '../../src/runtime/helpers/config';
import { createDefaultOptions } from '../utils/options';

const stateStore: Record<string, Ref<unknown>> = {};

export const useState = <T>(key: string, init?: () => T): Ref<T> => {
  if (!stateStore[key]) {
    stateStore[key] = ref(init ? init() : null) as Ref<unknown>;
  }
  return stateStore[key] as Ref<T>;
};

export const clearStateStore = (): void => {
  Object.keys(stateStore).forEach((key) => {
    delete stateStore[key];
  });
};

let runtimeConfigOptions: ModuleOptions = createDefaultOptions();

export const setRuntimeConfigOptions = (options: Partial<ModuleOptions>): void => {
  runtimeConfigOptions = { ...createDefaultOptions(), ...options };
};

export const useRuntimeConfig = () => ({
  public: {
    [MODULE_CONFIG_KEY]: runtimeConfigOptions,
  },
});

export const useRoute = vi.fn(() => ({
  path: '/',
  fullPath: '/',
  query: {},
  params: {},
  meta: {},
}));

export const useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
}));

export const navigateTo = vi.fn();

const cookieStore: Record<string, string | null | undefined> = {};

export const useCookie = vi.fn((name: string) => {
  const cookieRef = ref<string | null | undefined>(cookieStore[name] ?? null);

  return {
    get value() {
      return cookieStore[name] ?? null;
    },
    set value(value: string | null | undefined) {
      cookieStore[name] = value;
    },
  };
});

export const clearCookieStore = (): void => {
  Object.keys(cookieStore).forEach((key) => {
    delete cookieStore[key];
  });
};

export const createError = vi.fn((options: { statusCode: number; message?: string }) => {
  const error = new Error(options.message || `Error ${options.statusCode}`);
  (error as Error & { statusCode: number }).statusCode = options.statusCode;
  return error;
});

export const useNuxtApp = vi.fn(() => ({
  runWithContext: <T>(fn: () => T): T => fn(),
}));
