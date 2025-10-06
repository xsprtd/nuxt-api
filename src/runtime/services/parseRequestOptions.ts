import type { FetchContext, FetchOptions } from 'ofetch'
import { useApiOptions } from '../composables/useApiOptions'
import type { ModuleOptions } from '../types/ModuleOptions'
import { useErrorBag } from '../composables/useErrorBag'
import { useTokenStorage } from '../composables/useTokenStorage'
import { useCookie, useNuxtApp, useRequestHeaders, useRequestURL } from '#app'

/**
 * Get credentials.
 */
const getCredentials = (): RequestCredentials | undefined => {
  return 'credentials' in Request.prototype ? 'include' : undefined
}

/**
 * Fetch and initialize the CSRF cookie.
 */
const fetchCsrfCookie = async (
  config: ModuleOptions,
): Promise<void> => {
  try {
    await $fetch(config.endpoints.csrf, {
      baseURL: config.apiBaseURL,
      credentials: 'include',
    })
  }
  catch (error) {
    console.error('Failed to initialize CSRF cookie', error)
  }
}

/**
 * Attach the CSRF header to the request.
 */
const attachCsrfHeader = async (
  headers: HeadersInit | undefined,
  config: ModuleOptions,
): Promise<HeadersInit> => {
  let csrfToken = useCookie(config.csrf.cookieName, { readonly: true })

  if (!csrfToken.value) {
    await fetchCsrfCookie(config)
    csrfToken = useCookie(config.csrf.cookieName, { readonly: true })
  }

  if (!csrfToken.value) {
    console.warn(
      `Unable to set ${config.csrf.headerName} header`,
    )
    return headers ?? {}
  }

  return {
    ...headers,
    [config.csrf.headerName]: csrfToken.value,
  }
}

/**
 * Attach Referer and Origin headers.
 */
const attachServerHeaders = (
  headers: HeadersInit | undefined,
  config: ModuleOptions,
): HeadersInit => {
  const clientCookies = useRequestHeaders(['cookie'])

  const origin = config.originUrl ?? useRequestURL().origin

  return {
    ...headers,
    Referer: origin,
    Origin: origin,
    ...clientCookies,
  }
}

/**
 * Obtain and attach the authentication token to the request headers.
 */
const attachToken = async (
  headers: HeadersInit,
): Promise<HeadersInit> => {
  const token = await useTokenStorage().get()

  if (!token) {
    console.debug('Authentication token is not set in the storage')
    return headers
  }

  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  }
}

const extractHeaders = (context: FetchContext): { [k: string]: string } => {
  return context.options.headers instanceof Headers
    ? Object.fromEntries<string>(context.options.headers.entries())
    : context.options.headers
}

/**
 * Prepare request context.
 */
const prepareContext = async (
  context: FetchContext,
  config: ModuleOptions,
): Promise<void> => {
  const method = context.options.method?.toLowerCase() ?? 'get'

  context.options.headers = new Headers({
    Accept: 'application/json',
    ...config.headers,
    ...(extractHeaders(context)),
  })

  if (context.options.body instanceof FormData) {
    context.options.method = 'POST'
    context.options.body.append('_method', method.toUpperCase())
  }

  if (config.authMode === 'cookie') {
    if (import.meta.server) {
      context.options.headers = new Headers(
        attachServerHeaders(
          Object.fromEntries(context.options.headers.entries()),
          config,
        ),
      )
    }

    if (['post', 'delete', 'put', 'patch'].includes(method)) {
      context.options.headers = new Headers(
        await attachCsrfHeader(
          Object.fromEntries(context.options.headers.entries()),
          config,
        ),
      )
    }
  }
  else if (config.authMode === 'token') {
    context.options.headers = new Headers(
      await attachToken(
        Object.fromEntries(context.options.headers.entries()),
      ),
    )
  }
}

/**
 * Create and configure a new fetch service instance.
 */
export default (options?: FetchOptions): FetchOptions => {
  const config = useApiOptions()
  options ||= {}

  return {
    baseURL: config.apiBaseURL,
    credentials: getCredentials(),
    redirect: 'manual',
    retry: config.fetchOptions.retryAttempts,

    onRequest: async (context: FetchContext): Promise<void> => {
      if (options.onRequest) {
        if (Array.isArray(options.onRequest)) {
          for (const hook of options.onRequest) {
            await hook(context)
          }
        }
        else {
          await options.onRequest(context)
        }
      }

      await prepareContext(context, config)
    },

    onResponseError: async (context): Promise<void> => {
      useErrorBag().handle(context)

      if (options.onResponseError) {
        if (Array.isArray(options.onResponseError)) {
          for (const hook of options.onResponseError) {
            await hook(context)
          }
        }
        else {
          await options.onResponseError(context)
        }
      }
    },
  }
}
