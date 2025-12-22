import type { FetchOptions } from 'ofetch';
import type { ComputedRef, Ref } from 'vue';
import type { ErrorBagInterface } from './Http';

export interface Auth<T> {
  user: Ref<T | null>;
  isLoggedIn: ComputedRef<boolean>;
  refreshUser: () => Promise<void>;
  login: <LoginApiResponse>(credentials: Record<string, string>, clientOptions?: FetchOptions, callback?: (responseData: LoginApiResponse, user: T | null) => unknown) => Promise<unknown>;
  logout: (callback?: () => unknown) => Promise<unknown>;
  processing: Ref<boolean>;
  errorBag: ErrorBagInterface;
}
