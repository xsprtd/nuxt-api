import type { FetchOptions, FetchRequest, MappedResponseType, ResponseType } from 'ofetch'
import type { ErrorBagInterface, Http } from '../types/Http'
import { useApiFetch } from './useApiFetch'
import { useErrorBag } from './useErrorBag'
import { useProcessing } from './useProcessing'

export const useHttp = (): Http => {
  const { processing, startProcessing, stopProcessing } = useProcessing()
  const errorBag: ErrorBagInterface = useErrorBag()

  const call = async <T = unknown, R extends ResponseType = 'json'>(
    request: FetchRequest,
    method: string,
    payload?: Record<string, unknown>,
    options?: FetchOptions<R>,
  ): Promise<MappedResponseType<R, T>> => {
    try {
      startProcessing()

      const callOptions = payload
        ? ['get', 'delete'].includes(method)
            ? { query: payload }
            : { body: payload }
        : {}

      const response = await useApiFetch<T, R>(
        request,
        {
          method,
          ...callOptions,
          ...options,
        },
      )

      errorBag.reset()

      return response
    }
    catch (error: unknown) {
      stopProcessing()
      errorBag.handle(error as Error)
      throw error
    }
  }

  const get = async <T = unknown, R extends ResponseType = 'json'>(
    request: FetchRequest,
    query?: Record<string, unknown>,
    options?: FetchOptions<R>,
  ): Promise<MappedResponseType<R, T>> => call<T, R>(
    request, 'get', query, options,
  )

  const post = async <T = unknown, R extends ResponseType = 'json'>(
    request: FetchRequest,
    body?: Record<string, string>,
    options?: FetchOptions<R>,
  ): Promise<MappedResponseType<R, T>> => call<T, R>(
    request, 'post', body, options,
  )

  const put = async <T = unknown, R extends ResponseType = 'json'>(
    request: FetchRequest,
    body?: Record<string, string>,
    options?: FetchOptions<R>,
  ): Promise<MappedResponseType<R, T>> => call<T, R>(
    request, 'put', body, options,
  )

  const patch = async <T = unknown, R extends ResponseType = 'json'>(
    request: FetchRequest,
    body?: Record<string, string>,
    options?: FetchOptions<R>,
  ): Promise<MappedResponseType<R, T>> => call<T, R>(
    request, 'patch', body, options,
  )

  const destroy = async <T = unknown, R extends ResponseType = 'json'>(
    request: FetchRequest,
    query?: Record<string, unknown>,
    options?: FetchOptions<R>,
  ): Promise<MappedResponseType<R, T>> => call<T, R>(
    request, 'delete', query, options,
  )

  return {
    get,
    post,
    put,
    patch,
    destroy,
    processing,
    errorBag,
  }
}
