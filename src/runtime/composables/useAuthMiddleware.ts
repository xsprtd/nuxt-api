import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router';
import type { AuthCheckResult } from '../types/Auth';
import { useAuth } from './useAuth';
import { useApiOptions } from './useApiOptions';

export const useAuthMiddleware = () => {
  const { isLoggedIn } = useAuth();
  const options = useApiOptions();

  /**
   * Check if user should be allowed to access authenticated routes.
   * Returns redirect information if user is not authenticated.
   */
  const checkAuth = (to: RouteLocationNormalized): AuthCheckResult => {
    if (isLoggedIn.value) {
      return { isAuthenticated: true, redirectTo: null };
    }

    const loginPath = options.redirect.login;
    if (loginPath) {
      const redirect: RouteLocationRaw = { path: loginPath };
      if (options.redirect.intendedEnabled) {
        redirect.query = { redirect: to.fullPath };
      }
      return { isAuthenticated: false, redirectTo: redirect };
    }

    return { isAuthenticated: false, redirectTo: null };
  };

  /**
   * Check if authenticated user should be redirected away from guest-only routes.
   * Returns redirect information if user is authenticated.
   */
  const checkGuest = (to: RouteLocationNormalized): AuthCheckResult => {
    if (!isLoggedIn.value) {
      return { isAuthenticated: false, redirectTo: null };
    }

    const { intendedEnabled, postLogin } = options.redirect;

    if (intendedEnabled) {
      const requestedRoute = to.query.redirect as string;
      if (requestedRoute && requestedRoute !== to.path) {
        return { isAuthenticated: true, redirectTo: requestedRoute };
      }
    }

    if (postLogin) {
      return { isAuthenticated: true, redirectTo: postLogin };
    }

    return { isAuthenticated: true, redirectTo: null };
  };

  return {
    isLoggedIn,
    checkAuth,
    checkGuest,
  };
};
