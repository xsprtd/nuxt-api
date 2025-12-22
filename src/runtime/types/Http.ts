import type { FetchOptions, MappedResponseType, ResponseType } from 'ofetch';
import type { Ref } from 'vue';

type WithQuery = <T = unknown, R extends ResponseType = 'json'>(
  request: string,
  query?: Record<string, unknown>,
  options?: FetchOptions<R>,
) => Promise<MappedResponseType<R, T>>;

type WithBody = <T = unknown, R extends ResponseType = 'json'>(
  request: string,
  body?: Record<string, string>,
  options?: FetchOptions<R>,
) => Promise<MappedResponseType<R, T>>;

export interface Http {
  get: WithQuery;
  post: WithBody;
  put: WithBody;
  patch: WithBody;
  destroy: WithQuery;
  processing: Ref<boolean>;
  errorBag: ErrorBagInterface;
}

export interface Errors {
  [key: string]: string[];
}

export interface ErrorBagInterface {
  message: Ref<string | null>;
  errors: Ref<Errors | null>;
  handle: (error?: Error) => void;
  reset: () => void;
  has: (key: string) => boolean;
  get: <T = false>(key: string, defaultValue?: T) => string | T;
}

export interface FormValidationError {
  message: string | null;
  errors: Errors | null;
}

export interface ResponseError extends Error {
  response?: {
    status?: number;
    _data?: FormValidationError;
  };
}
