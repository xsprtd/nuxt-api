import { useApiOptions } from '../composables/useApiOptions';
import { useApiFetch } from '../composables/useApiFetch';
import extractNestedValue from '../helpers/extractNestedValue';

export async function getAuthUser<T = string>(): Promise<T | null> {
  const options = useApiOptions();
  const responseKey = options.userResponseKey || null;

  const response = await useApiFetch(options.endpoints.user);

  return extractNestedValue<T>(
    response,
    responseKey,
  );
}
