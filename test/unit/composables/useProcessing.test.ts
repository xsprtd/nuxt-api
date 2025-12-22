import { describe, it, expect } from 'vitest';
import { useProcessing } from '../../../src/runtime/composables/useProcessing';

describe('useProcessing', () => {
  it('returns processing ref with initial value of false', () => {
    const { processing } = useProcessing();

    expect(processing.value).toBe(false);
  });

  it('sets processing to true when startProcessing is called', () => {
    const { processing, startProcessing } = useProcessing();

    startProcessing();

    expect(processing.value).toBe(true);
  });

  it('sets processing to false when stopProcessing is called', () => {
    const { processing, startProcessing, stopProcessing } = useProcessing();

    startProcessing();
    expect(processing.value).toBe(true);

    stopProcessing();
    expect(processing.value).toBe(false);
  });

  it('creates independent instances', () => {
    const instance1 = useProcessing();
    const instance2 = useProcessing();

    instance1.startProcessing();

    expect(instance1.processing.value).toBe(true);
    expect(instance2.processing.value).toBe(false);
  });
});
