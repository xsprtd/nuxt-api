import type { Ref } from 'vue';

export interface Processing {
  processing: Ref<boolean>;
  startProcessing: () => void;
  stopProcessing: () => void;
}
