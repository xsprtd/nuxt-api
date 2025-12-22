import { useApiOptions } from '../composables/useApiOptions';
import { useAuth } from '../composables/useAuth';
import { defineNuxtRouteMiddleware, navigateTo, createError } from '#app';

export default defineNuxtRouteMiddleware(async (to) => {
  const { isLoggedIn } = useAuth();
  const { redirect } = useApiOptions();

  if (!isLoggedIn.value) {
    return;
  }

  const { intendedEnabled, postLogin } = redirect;

  if (intendedEnabled) {
    const currentPath = to.path;
    const requestedRoute = to.query.redirect as string;

    if (requestedRoute && requestedRoute !== currentPath) {
      return navigateTo(requestedRoute);
    }
  }

  if (postLogin) {
    return navigateTo(postLogin, { replace: true });
  }

  throw createError({ statusCode: 403 });
});
