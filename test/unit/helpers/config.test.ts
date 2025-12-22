import { describe, it, expect } from 'vitest';
import { MODULE_NAME, MODULE_CONFIG_KEY } from '~/src/runtime/helpers/config';

describe('config', () => {
  describe('MODULE_NAME', () => {
    it('exports the correct module name', () => {
      expect(MODULE_NAME).toBe('nuxt-api');
    });
  });

  describe('MODULE_CONFIG_KEY', () => {
    it('exports the correct config key', () => {
      expect(MODULE_CONFIG_KEY).toBe('nuxtApi');
    });
  });
});
