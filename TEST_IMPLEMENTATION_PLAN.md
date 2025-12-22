# Test Suite Implementation Plan

This document outlines a comprehensive test suite implementation for the `@xsprtd/nuxt-api` Nuxt module. The plan is broken down into small, manageable tasks that can be implemented one by one.

## Overview

- **Test Framework**: Vitest (already configured)
- **Test Utilities**: @nuxt/test-utils (already installed)
- **HTTP Mocking**: Vitest mocks
- **Coverage**: Unit tests, integration tests, type tests

---

## Phase 1: Test Infrastructure Setup

### Task 1.1: Create test directory structure
- [ ] Create `/test/unit/` directory for unit tests
- [ ] Create `/test/integration/` directory for integration tests
- [ ] Create `/test/mocks/` directory for shared mocks
- [ ] Create `/test/utils/` directory for test utilities

### Task 1.2: Configure Vitest
- [ ] Create `vitest.config.ts` with proper configuration
- [ ] Configure test coverage reporting
- [ ] Set up path aliases matching tsconfig
- [ ] Configure test environment (happy-dom)

### Task 1.3: Create shared test utilities
- [ ] Create mock factory for Nuxt runtime config
- [ ] Create mock factory for `$fetch`
- [ ] Create mock factory for Nuxt composables (useState, useRoute, etc.)
- [ ] Create test helpers for common assertions

---

## Phase 2: Helper Function Tests

### Task 2.1: Test `extractNestedValue` helper
- [ ] Test simple key extraction (`'user'` → `response.user`)
- [ ] Test nested key extraction (`'data.user'` → `response.data.user`)
- [ ] Test deeply nested keys (`'data.attributes.user'`)
- [ ] Test undefined/null response handling
- [ ] Test missing key handling
- [ ] Test empty string key (returns full response)

### Task 2.2: Test `config` helper
- [ ] Test runtime config retrieval
- [ ] Test default values application

---

## Phase 3: Composable Unit Tests

### Task 3.1: Test `useApiOptions` composable
- [ ] Test returns runtime config options
- [ ] Test all option properties are accessible

### Task 3.2: Test `useProcessing` composable
- [ ] Test initial state is `false`
- [ ] Test `start()` sets state to `true`
- [ ] Test `stop()` sets state to `false`
- [ ] Test `value` computed property

### Task 3.3: Test `useErrorBag` composable
- [ ] Test initial state (empty message, empty errors)
- [ ] Test `handle()` with 422 validation error
- [ ] Test `handle()` with 419 CSRF error
- [ ] Test `handle()` with 401 unauthenticated error
- [ ] Test `handle()` with generic error (500, etc.)
- [ ] Test `has()` method for field errors
- [ ] Test `get()` method for field error messages
- [ ] Test `reset()` clears all errors
- [ ] Test `setErrors()` method
- [ ] Test nested error key extraction

### Task 3.4: Test `useTokenStorage` composable
- [ ] Test cookie storage provider `get()`
- [ ] Test cookie storage provider `set()`
- [ ] Test cookie storage provider `remove()`
- [ ] Test localStorage provider `get()`
- [ ] Test localStorage provider `set()`
- [ ] Test localStorage provider `remove()`
- [ ] Test provider selection based on config
- [ ] Test SSR handling (server-side token access)

### Task 3.5: Test `useCurrentUser` composable
- [ ] Test returns shared user state
- [ ] Test user state type generics

### Task 3.6: Test `useApiFetch` composable
- [ ] Test returns configured `$fetch` instance
- [ ] Test base URL configuration
- [ ] Test credentials configuration

---

## Phase 4: Service Unit Tests

### Task 4.1: Test `parseRequestOptions` service - Base configuration
- [ ] Test base URL is set from config
- [ ] Test credentials mode is set
- [ ] Test retry attempts configuration
- [ ] Test custom headers are merged
- [ ] Test Accept header default

### Task 4.2: Test `parseRequestOptions` service - Cookie mode
- [ ] Test CSRF cookie is fetched on first mutating request
- [ ] Test CSRF header is attached to POST requests
- [ ] Test CSRF header is attached to PUT requests
- [ ] Test CSRF header is attached to PATCH requests
- [ ] Test CSRF header is attached to DELETE requests
- [ ] Test CSRF is NOT attached to GET requests
- [ ] Test CSRF cookie name from config

### Task 4.3: Test `parseRequestOptions` service - Token mode
- [ ] Test Bearer token is attached when present
- [ ] Test token is retrieved from storage
- [ ] Test no Authorization header when token absent

### Task 4.4: Test `parseRequestOptions` service - FormData handling
- [ ] Test FormData body passes through
- [ ] Test method spoofing for PUT with FormData
- [ ] Test method spoofing for PATCH with FormData
- [ ] Test method spoofing for DELETE with FormData
- [ ] Test `_method` field is added to FormData

### Task 4.5: Test `getAuthUser` service
- [ ] Test fetches user from configured endpoint
- [ ] Test extracts user with simple key
- [ ] Test extracts user with nested key (dot notation)
- [ ] Test returns null on 401 error
- [ ] Test returns null on network error

---

## Phase 5: HTTP Composable Tests

### Task 5.1: Test `useHttp` - GET requests
- [ ] Test `get()` makes GET request
- [ ] Test query parameters are appended
- [ ] Test response data is returned
- [ ] Test processing state during request
- [ ] Test error handling and error bag population

### Task 5.2: Test `useHttp` - POST requests
- [ ] Test `post()` makes POST request
- [ ] Test body payload is sent
- [ ] Test FormData body is handled
- [ ] Test processing state during request
- [ ] Test validation error (422) handling

### Task 5.3: Test `useHttp` - PUT/PATCH requests
- [ ] Test `put()` makes PUT request
- [ ] Test `patch()` makes PATCH request
- [ ] Test body payload is sent
- [ ] Test processing state during request

### Task 5.4: Test `useHttp` - DELETE requests
- [ ] Test `destroy()` makes DELETE request
- [ ] Test query parameters are appended
- [ ] Test processing state during request

### Task 5.5: Test `useHttp` - Shared state
- [ ] Test `processing` is reactive
- [ ] Test `errorBag` is shared across methods
- [ ] Test error is cleared on new request (configurable)

---

## Phase 6: Auth Composable Tests

### Task 6.1: Test `useAuth` - Login flow
- [ ] Test `login()` calls login endpoint
- [ ] Test credentials are sent in body
- [ ] Test user is refreshed after login
- [ ] Test `isLoggedIn` becomes true after login
- [ ] Test processing state during login
- [ ] Test validation errors populate error bag
- [ ] Test custom login callback is invoked

### Task 6.2: Test `useAuth` - Login redirects
- [ ] Test redirect to postLogin path after success
- [ ] Test intended redirect when enabled
- [ ] Test no redirect when disabled
- [ ] Test redirect to custom path

### Task 6.3: Test `useAuth` - Logout flow
- [ ] Test `logout()` calls logout endpoint
- [ ] Test user state is cleared
- [ ] Test `isLoggedIn` becomes false
- [ ] Test token is removed (token mode)
- [ ] Test redirect to postLogout path

### Task 6.4: Test `useAuth` - User management
- [ ] Test `user` returns current user state
- [ ] Test `refreshUser()` fetches fresh user data
- [ ] Test user state updates on refresh
- [ ] Test 401 response clears user

### Task 6.5: Test `useAuth` - Token mode specifics
- [ ] Test token is extracted from login response
- [ ] Test token is stored in configured storage
- [ ] Test token extraction with nested key

---

## Phase 7: Middleware Tests

### Task 7.1: Test `auth` middleware
- [ ] Test allows authenticated users to proceed
- [ ] Test redirects unauthenticated users to login
- [ ] Test stores intended route for redirect
- [ ] Test throws 403 when redirect disabled
- [ ] Test custom middleware name from config

### Task 7.2: Test `guest` middleware
- [ ] Test allows unauthenticated users to proceed
- [ ] Test redirects authenticated users to postLogin
- [ ] Test throws 403 when redirect disabled
- [ ] Test custom middleware name from config

---

## Phase 8: Integration Tests

### Task 8.1: Test module setup
- [ ] Test module registers with Nuxt
- [ ] Test composables are auto-imported
- [ ] Test middleware is registered
- [ ] Test runtime config is populated

### Task 8.2: Test plugin initialization
- [ ] Test user is fetched on app initialization
- [ ] Test user state is populated if authenticated
- [ ] Test user state is null if not authenticated

### Task 8.3: Test full authentication flow (cookie mode)
- [ ] Test CSRF fetch → login → user fetch → redirect
- [ ] Test logout → user clear → redirect
- [ ] Test 401 response → auto logout

### Task 8.4: Test full authentication flow (token mode)
- [ ] Test login → token extract → token store → user fetch
- [ ] Test subsequent requests have Bearer token
- [ ] Test logout → token remove → user clear

---

## Phase 9: Type Tests

### Task 9.1: Validate TypeScript types
- [ ] Ensure existing `test:types` script passes
- [ ] Add type tests for generic user type in `useAuth<T>`
- [ ] Add type tests for response types in `useHttp`

---

## Phase 10: Coverage and Documentation

### Task 10.1: Achieve coverage targets
- [ ] Achieve >80% line coverage
- [ ] Achieve >80% branch coverage
- [ ] Document any intentionally uncovered code

### Task 10.2: Update documentation
- [ ] Add testing section to README
- [ ] Document how to run tests
- [ ] Document how to add new tests

---

## Implementation Order

The recommended implementation order is:

1. **Phase 1** - Set up infrastructure (Tasks 1.1-1.3)
2. **Phase 2** - Test simple helpers (Tasks 2.1-2.2)
3. **Phase 3** - Test composables bottom-up (Tasks 3.1-3.6)
4. **Phase 4** - Test services (Tasks 4.1-4.5)
5. **Phase 5** - Test HTTP composable (Tasks 5.1-5.5)
6. **Phase 6** - Test Auth composable (Tasks 6.1-6.5)
7. **Phase 7** - Test middleware (Tasks 7.1-7.2)
8. **Phase 8** - Integration tests (Tasks 8.1-8.4)
9. **Phase 9** - Type validation (Task 9.1)
10. **Phase 10** - Coverage and docs (Tasks 10.1-10.2)

---

## Notes

- Each task is designed to be completable in a single focused session
- Tests should be written in TypeScript
- Follow existing code style (ESLint/Prettier configuration)
- Use descriptive test names that explain expected behavior
- Mock external dependencies (`$fetch`, Nuxt composables)
- Test both success and failure paths

---

## Getting Started

To begin implementation, run:

```bash
# Prepare the development environment
npm run dev:prepare

# Run existing tests (should pass with no tests)
npm run test

# Run tests in watch mode during development
npm run test:watch
```
