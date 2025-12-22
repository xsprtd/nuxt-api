import { beforeEach, vi } from 'vitest';
import { clearStateStore, clearCookieStore, setRuntimeConfigOptions } from '../mocks/app';

beforeEach(() => {
  clearStateStore();
  clearCookieStore();
  setRuntimeConfigOptions({});
  vi.clearAllMocks();
});
