import type {
  FetchRequest,
  FetchOptions,
  MappedResponseType,
  ResponseType, $Fetch,
} from 'ofetch';
import parseRequestOptions from '../services/parseRequestOptions';

export const useApiFetch = <T = unknown, R extends ResponseType = 'json'>(
  request: FetchRequest,
  options?: FetchOptions<R>,
): Promise<MappedResponseType<R, T>> => {
  const { onRequest, onResponseError, ...otherOptions } = options || {};

  const fetchService: $Fetch = $fetch.create(parseRequestOptions({
    ...(onRequest ? { onRequest } : {}),
    ...(onResponseError ? { onResponseError } : {}),
  } as FetchOptions<ResponseType>)) as $Fetch;

  return fetchService(request, otherOptions);
};
