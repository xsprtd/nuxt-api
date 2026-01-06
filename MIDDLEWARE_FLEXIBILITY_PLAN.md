# Middleware Registration Flexibility Plan

## Problem Statement

The current implementation at `src/module.ts:40-43` always registers middleware with names `auth` and `guest` (or custom names via `middlewareNames`). This causes conflicts when:

1. The consuming application has its own middleware with the same name
2. The consuming application uses a single middleware to handle both authenticated and guest states
3. The consuming application wants full control over middleware registration

**Current behavior:** Both the package middleware AND the application's middleware get registered, leading to unexpected behavior and conflicts.

## Proposed Solution

Change defaults to `false` (no middleware registered) and allow opting-in by setting a string name. This avoids conflicts with consuming applications that have their own middleware.

### Why Default to `false`

When both the package AND the consuming app register middleware with the same name, **both middlewares run** - they don't override each other. This causes the conflict. By defaulting to `false`, the package stays out of the way and apps opt-in explicitly.

### Configuration API Changes

```typescript
// Current defaults (always registers, causes conflicts)
middlewareNames: {
  auth: 'auth',
  guest: 'guest',
}

// New defaults (disabled by default)
middlewareNames: {
  auth: false,
  guest: false,
}
```

### Usage Examples

```typescript
// Example 1: Default behavior - no middleware registered
// Apps with their own middleware work without conflicts
export default defineNuxtConfig({
  nuxtApi: {
    // middlewareNames defaults to { auth: false, guest: false }
  }
})

// Example 2: Opt-in to package middleware
export default defineNuxtConfig({
  nuxtApi: {
    middlewareNames: {
      auth: 'auth',
      guest: 'guest',
    }
  }
})

// Example 3: Enable only one middleware
export default defineNuxtConfig({
  nuxtApi: {
    middlewareNames: {
      auth: 'auth',
      guest: false,
    }
  }
})

// Example 4: Custom names to avoid any potential conflicts
export default defineNuxtConfig({
  nuxtApi: {
    middlewareNames: {
      auth: 'requiresAuth',
      guest: 'guestOnly',
    }
  }
})
```

---

## Implementation Tasks

### Task 1: Update `ModuleOptions` type definition

**File:** `src/runtime/types/ModuleOptions.ts`

Update the `middlewareNames` interface to accept `false`:

```typescript
middlewareNames: {
  /**
   * Middleware name for authenticated users.
   * Set to a string to register the middleware with that name.
   * Set to `false` to disable automatic registration (default).
   */
  auth: string | false;

  /**
   * Middleware name for guest users.
   * Set to a string to register the middleware with that name.
   * Set to `false` to disable automatic registration (default).
   */
  guest: string | false;
};
```

### Task 2: Update module defaults

**File:** `src/module.ts`

Change the default values from strings to `false`:

```typescript
middlewareNames: {
  auth: false as const,
  guest: false as const,
},
```

### Task 3: Update module setup to conditionally register middleware

**File:** `src/module.ts`

Modify the `addRouteMiddleware` calls to check for `false`:

```typescript
if (moduleOptions.middlewareNames.auth !== false) {
  addRouteMiddleware({
    name: moduleOptions.middlewareNames.auth,
    path: resolver.resolve('./runtime/middleware/auth.custom'),
  });
}

if (moduleOptions.middlewareNames.guest !== false) {
  addRouteMiddleware({
    name: moduleOptions.middlewareNames.guest,
    path: resolver.resolve('./runtime/middleware/guest.custom'),
  });
}
```

### Task 4: Export middleware helpers for custom implementations

**File:** `src/runtime/composables/useAuthMiddleware.ts` (new file)

Create reusable helpers that expose the core middleware logic:

```typescript
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router';
import { useAuth } from './useAuth';
import { useApiOptions } from './useApiOptions';

export interface AuthMiddlewareResult {
  isAuthenticated: boolean;
  redirectTo: RouteLocationRaw | null;
}

export function useAuthMiddleware() {
  const { isLoggedIn } = useAuth();
  const options = useApiOptions();

  /**
   * Check if user should be allowed to access authenticated routes
   */
  function checkAuth(to: RouteLocationNormalized): AuthMiddlewareResult {
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
  }

  /**
   * Check if authenticated user should be redirected away from guest routes
   */
  function checkGuest(to: RouteLocationNormalized): AuthMiddlewareResult {
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
  }

  return {
    isLoggedIn,
    checkAuth,
    checkGuest,
  };
}
```

### Task 5: Register the new composable export

**File:** `src/module.ts` - The `addImportsDir` already handles this automatically since it imports the entire composables directory.

### Task 6: Update tests

**File:** `test/unit/module.test.ts` or similar

Add tests for:
- Middleware does NOT register when value is `false` (default)
- Middleware registers when value is a string
- Mixed configuration (one enabled, one disabled)

### Task 7: Update documentation

**File:** `README.md`

Add documentation section explaining:
- How to disable middleware registration
- How to use `useAuthMiddleware()` helper for custom implementations
- Example of a custom unified middleware

---

## Documentation Example for README

```markdown
### Enabling Built-in Middleware

By default, the package does not register any middleware. To use the built-in
auth and guest middleware, explicitly enable them:

\`\`\`typescript
export default defineNuxtConfig({
  nuxtApi: {
    middlewareNames: {
      auth: 'auth',   // Register auth middleware
      guest: 'guest', // Register guest middleware
    }
  }
})
\`\`\`

### Custom Middleware with Package Helpers

Use the `useAuthMiddleware()` composable to build custom middleware
while leveraging the package's authentication state:

\`\`\`typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const { checkAuth } = useAuthMiddleware();
  const result = checkAuth(to);

  if (!result.isAuthenticated && result.redirectTo) {
    return navigateTo(result.redirectTo, { replace: true });
  }

  // Add your custom logic here
});
\`\`\`
```

---

## Considerations

### Breaking Change

This is a **breaking change** from previous versions:

| Before (v1.x) | After (v2.x) |
|---------------|--------------|
| Middleware registered by default | Middleware disabled by default |
| `middlewareNames.auth: 'auth'` | `middlewareNames.auth: false` |
| `middlewareNames.guest: 'guest'` | `middlewareNames.guest: false` |

### Migration Guide

Users upgrading from previous versions who want to keep the old behavior must add:

```typescript
export default defineNuxtConfig({
  nuxtApi: {
    middlewareNames: {
      auth: 'auth',
      guest: 'guest',
    }
  }
})
```

### Alternative Approaches Considered

1. **Keep defaults as strings (non-breaking)** - Would still cause conflicts for apps with their own middleware
2. **Global `middleware.enabled: false` flag** - Less granular, doesn't allow enabling one while disabling another
3. **Use empty string `''` to disable** - Less explicit than `false`, could be confused with misconfiguration

### Why This Approach

- Avoids middleware conflicts out of the box
- Intuitive semantics (`false` = disabled, string = enabled with that name)
- Granular control (per-middleware)
- Composable helpers provide escape hatch for advanced users
- Clear migration path for existing users
