import type { RouteLocationRaw } from 'vue-router';
import { useApiOptions } from '../composables/useApiOptions';
import { useAuth } from '../composables/useAuth';
import { defineNuxtRouteMiddleware, navigateTo, createError } from '#app';

export default defineNuxtRouteMiddleware((to) => {
  const { isLoggedIn } = useAuth();
  if (isLoggedIn.value) {
    return;
  }

  const options = useApiOptions();
  const loginPath = options.redirect.login;

  if (!isLoggedIn.value && loginPath) {
    const redirect: RouteLocationRaw = { path: loginPath };

    if (options.redirect.intendedEnabled) {
      redirect.query = { redirect: to.fullPath };
    }

    return navigateTo(redirect, { replace: true });
  }

  throw createError({ statusCode: 403 });
});
