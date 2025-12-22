import { ref, type Ref } from 'vue';
import type { Processing } from '../types/Processing';

export const useProcessing = (): Processing => {
  const processing: Ref<boolean> = ref(false);

  const startProcessing = (): void => {
    processing.value = true;
  };

  const stopProcessing = (): void => {
    processing.value = false;
  };

  return {
    processing,
    startProcessing,
    stopProcessing,
  };
};
