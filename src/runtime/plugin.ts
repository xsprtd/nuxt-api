import { useCurrentUser } from './composables/useCurrentUser';
import { getAuthUser } from './services/getAuthUser';
import { defineNuxtPlugin } from '#app';

export default defineNuxtPlugin(async () => {
  const user = useCurrentUser();

  // this part sets user after reload
  if (!user.value) {
    try {
      user.value = await getAuthUser();
    }
    catch (error) {
      console.debug('Failed to fetch authenticated user:', error);
    }
  }
});
