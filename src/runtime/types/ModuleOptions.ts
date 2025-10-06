type AuthMode = 'cookie' | 'token'
type TokenStorageType = 'cookie' | 'localStorage'

export interface ModuleOptions {
  /**
   * The base URL of the API server.
   * @example http://localhost:8000
   */
  apiBaseURL: string

  /**
   * The current application base URL for the Referrer and Origin header.
   * @example 'http://localhost:3000'
   */
  originUrl?: string

  /**
   * The authentication mode.
   */
  authMode: AuthMode

  /**
   * The key to use to store the authenticated user in the `useState` variable.
   */
  userStateKey: string

  /**
   * Defines the key used to extract user data from the `endpoints.user` API response.
   *
   * Example usage: for response `{ user: { ... } }` it would be `user`
   */
  userResponseKey?: null | string

  /**
   * Custom headers to include in API requests.
   */
  headers: { [k: string]: string }

  /**
   * The token specific options.
   */
  token: {
    /**
     * The key to store the token in the storage.
     */
    storageKey: string

    /**
     * The storage type to use for the token.
     */
    storageType: TokenStorageType

    /**
     * Defines the key used to extract user data from the `endpoints.login` API response.
     *
     * Example usage: for response `{ auth_token: { ... } }` it would be `auth_token`
     */
    responseKey: string
  }

  /**
   * Fetch options.
   */
  fetchOptions: {
    /**
     * The number of times to retry a request when it fails.
     */
    retryAttempts: number | false
  }

  /**
   * CSRF token options.
   */
  csrf: {
    /**
     * Name of the CSRF cookie to extract from server response.
     */
    cookieName: string

    /**
     * Name of the CSRF header to pass from client to server.
     */
    headerName: string
  }

  /**
   * API endpoints.
   */
  endpoints: {
    /**
     * The endpoint to obtain a new CSRF token.
     */
    csrf: string

    /**
     * The authentication endpoint.
     */
    login: string

    /**
     * The logout endpoint.
     */
    logout: string

    /**
     * The endpoint to fetch current user data.
     */
    user: string
  }

  /**
   * Redirect specific settings.
   */
  redirect: {
    /**
     * Specifies whether to retain the requested route when redirecting after login.
     */
    intendedEnabled: boolean

    /**
     * Redirect path when access requires user authentication.
     * Throws a 403 error if set to false.
     */
    login: string | false

    /**
     * Redirect path after a successful login.
     * No redirection if set to false.
     */
    postLogin: string | false

    /**
     * Redirect path after a logout.
     * No redirection if set to false.
     */
    postLogout: string | false
  }

  middlewareNames: {
    /**
     * Middleware name for authenticated users.
     */
    auth: string

    /**
     * Middleware name for guest users.
     */
    guest: string
  }

  errorMessages: {
    /**
     * A default error message.
     */
    default: string

    /**
     * Error message to display when csrf token isn't valid.
     */
    csrf: string

    /**
     * Error message to display when user is not-authenticated.
     */
    unauthenticated: string
  }
}
