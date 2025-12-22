import type { ModuleOptions } from '../types/ModuleOptions';
import { MODULE_CONFIG_KEY } from '../helpers/config';
import { useRuntimeConfig } from '#app';

export const useApiOptions = (): ModuleOptions => {
  return useRuntimeConfig().public[MODULE_CONFIG_KEY] as ModuleOptions;
};
