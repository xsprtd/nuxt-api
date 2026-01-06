# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-01-06

### Breaking Changes

- **Middleware disabled by default**: `middlewareNames.auth` and `middlewareNames.guest` now default to `false` instead of `'auth'` and `'guest'`. This prevents conflicts when consuming applications have their own middleware with the same names. To restore the previous behavior, explicitly set the middleware names in your config:
  ```typescript
  nuxtApi: {
    middlewareNames: {
      auth: 'auth',
      guest: 'guest',
    }
  }
  ```

### Added

- New `useAuthMiddleware` composable for building custom middleware with package's auth state
  - `checkAuth(to)` - Returns authentication status and redirect info for protected routes
  - `checkGuest(to)` - Returns authentication status and redirect info for guest-only routes
- New `AuthCheckResult` type exported from `types/Auth.ts`
- 11 new tests for `useAuthMiddleware` composable (total now 202 tests)

### Changed

- `middlewareNames` type updated to accept `string | false` for both `auth` and `guest`
- Middleware registration is now conditional based on configuration
- Updated README with comprehensive middleware documentation and examples

## [1.4.0] - 2025-12-22

### Added

- Comprehensive test suite with 191 tests covering all core functionality
- Unit tests for all composables (`useAuth`, `useHttp`, `useProcessing`, `useErrorBag`, `useTokenStorage`, `useCurrentUser`, `useApiOptions`)
- Unit tests for services (`parseRequestOptions`, `getAuthUser`)
- Unit tests for middleware (`auth`, `guest`)
- Unit tests for helpers (`extractNestedValue`, `config`)
- Integration tests for cookie-based and token-based authentication flows
- Plugin initialization tests
- Test mocks for Nuxt composables (`useState`, `useRoute`, `useCookie`, `navigateTo`, etc.)
- Test utilities and helper functions
- Coverage reporting with @vitest/coverage-v8

### Changed

- Updated package.json exports to use `.d.mts` types format (module-builder v1.0 compatibility)
- Updated `@nuxt/module-builder` from ^0.8.4 to ^1.0.2
- Updated `happy-dom` to ^20.0.0
- Moved Prettier configuration to package.json
- Updated ESLint stylistic rules for consistent semicolon usage

### Removed

- Removed `semantic-release` package (manual releases preferred)
- Removed `.github/workflows/release.yml` workflow

### Fixed

- Fixed import path in `useProcessing.ts` (changed from alias to relative path)

## [1.3.0] - 2025-12-20

### Added

- Initial release with Laravel Sanctum authentication support
- Cookie-based (SPA) and token-based authentication modes
- HTTP client composables (`useHttp`)
- Authentication composables (`useAuth`)
- Error bag handling (`useErrorBag`)
- Route middleware (`auth`, `guest`)
- CSRF protection for cookie mode
- TypeScript support with full type definitions
