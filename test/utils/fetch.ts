import type { FetchContext } from 'ofetch';

export const createFetchContext = (overrides?: Partial<FetchContext>): FetchContext => ({
  request: 'http://localhost:8000/api/test',
  options: {
    method: 'GET',
    headers: {},
    ...overrides?.options,
  },
  ...overrides,
});
