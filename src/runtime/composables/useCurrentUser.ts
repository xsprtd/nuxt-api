import type { Ref } from 'vue';
import { useApiOptions } from './useApiOptions';
import { useState } from '#app';

export const useCurrentUser = <T>(): Ref<T | null> => {
  return useState<T | null>(useApiOptions().userStateKey, () => null);
};
