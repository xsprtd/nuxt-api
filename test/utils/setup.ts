import { beforeEach, vi } from 'vitest';
import { clearStateStore, setRuntimeConfigOptions } from '../mocks/app';

beforeEach(() => {
  clearStateStore();
  setRuntimeConfigOptions({});
  vi.clearAllMocks();
});
