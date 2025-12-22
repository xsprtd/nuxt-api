# Changelog

All notable changes to this project will be documented in this file.

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
