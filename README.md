# Nuxt API Authentication and Http Client

A comprehensive Nuxt 3 module providing seamless Laravel Sanctum authentication and HTTP client functionality. This module supports both cookie-based (SPA) and token-based authentication with built-in error handling, TypeScript support, and automatic CSRF protection.

This module is based on [@qirolab/nuxt-sanctum-authentication](https://github.com/qirolab/nuxt-sanctum-authentication) with significant enhancements and additional functionality.

## Features

- **Dual Authentication Modes**: Cookie-based (SPA) and Token-based authentication
- **Laravel Sanctum Integration**: Built specifically for Laravel Sanctum with automatic CSRF handling
- **Type-Safe HTTP Client**: Full TypeScript support with generics for requests and responses
- **Auto-imported Composables**: Ready-to-use authentication and HTTP methods
- **Error Handling**: Comprehensive error bag system for validation and API errors
- **Route Protection**: Built-in middleware for authenticated and guest-only routes
- **Flexible Storage**: Token storage in cookies or localStorage
- **Processing States**: Built-in loading states for all async operations
- **Custom Headers**: Global and per-request custom header support
- **Retry Logic**: Configurable retry attempts for failed requests
- **SSR Compatible**: Full server-side rendering support

---

## Installation

Install the module using npm:

```shell
npm i @xsprtd/nuxt-api
```

---

## Configuration

Within your `nuxt.config.ts` add the `@xsprtd/nuxt-api` to the list of modules and the `nuxtApi` entry and overwrite the relevant options.

```javascript
export default defineNuxtConfig({
  modules: [
    //...
    '@xsprtd/nuxt-api'
    //...
  ],
  //...
  nuxtApi: {
    apiBaseURL: process.env.API_BASE_URL,
    authMode: 'cookie',
    userStateKey: 'user',
    headers: {},
    token: {
      storageKey: 'AUTH_TOKEN',
      storageType: 'cookie',
      responseKey: 'token',
    },
    fetchOptions: {
      retryAttempts: false,
    },
    csrf: {
      cookieName: 'XSRF-TOKEN',
      headerName: 'X-XSRF-TOKEN',
    },
    endpoints: {
      csrf: '/sanctum/csrf-cookie',
      login: '/api/login',
      logout: '/api/logout',
      user: '/api/user',
    },
    redirect: {
      intendedEnabled: false,
      login: '/login',
      postLogin: '/dashboard',
      postLogout: '/login',
    },
    middlewareNames: {
      auth: false,
      guest: false,
    },
    errorMessages: {
      default: 'Whoops - something went wrong',
      csrf: 'CSRF token mismatch',
      unauthenticated: 'Unauthenticated',
    },
  },
  //...
})
```
<details>
<summary>The list of all currently available options</summary>

```typescript
interface ModuleOptions {
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
  authMode: 'cookie' | 'token'

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
    storageType: 'cookie' | 'localStorage'

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
     * Set to a string to register the middleware with that name.
     * Set to `false` to disable automatic registration (default).
     */
    auth: string | false

    /**
     * Middleware name for guest users.
     * Set to a string to register the middleware with that name.
     * Set to `false` to disable automatic registration (default).
     */
    guest: string | false
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
```
</details>

---

## Laravel Sanctum Backend Setup (Laravel 11+)

Before using this module, you need to configure Laravel Sanctum on your backend. Below are complete setup instructions for Laravel 11 and newer.

> **Note**: Laravel 11+ includes Sanctum by default. If you're using Laravel 10 or older, you'll need to install Sanctum manually with `composer require laravel/sanctum`.

### 1. Install & Publish Sanctum (if needed)

For fresh Laravel 11+ installations, Sanctum is already installed. Just publish the configuration:

```bash
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

For older Laravel versions:

```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

### 2. Configure CORS

Update `config/cors.php`:

```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => explode(',', env('FRONTEND_URL', 'http://localhost:3000')),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
```

### 3. Configure Sanctum

Update `config/sanctum.php`:

```php
return [
    /*
    |--------------------------------------------------------------------------
    | Stateful Domains
    |--------------------------------------------------------------------------
    */
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s%s',
        'localhost,localhost:3000,localhost:8000,127.0.0.1,127.0.0.1:8000,::1',
        env('APP_URL') ? ','.parse_url(env('APP_URL'), PHP_URL_HOST) : '',
        env('FRONTEND_URL') ? ','.parse_url(env('FRONTEND_URL'), PHP_URL_HOST) : ''
    ))),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Guards
    |--------------------------------------------------------------------------
    */
    'guard' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Expiration Minutes
    |--------------------------------------------------------------------------
    */
    'expiration' => null,

    /*
    |--------------------------------------------------------------------------
    | Token Prefix
    |--------------------------------------------------------------------------
    */
    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Middleware
    |--------------------------------------------------------------------------
    */
    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'validate_csrf_token' => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ],
];
```

### 4. Configure Middleware (Laravel 11+)

In Laravel 11+, middleware is configured in `bootstrap/app.php` instead of `app/Http/Kernel.php`:

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);

        $middleware->alias([
            'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
        ]);

        // For cookie-based authentication, ensure stateful API
        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```

**For Laravel 10 and older**, configure in `app/Http/Kernel.php`:

```php
'api' => [
    \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    \Illuminate\Routing\Middleware\ThrottleRequests::class.':api',
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
],
```

### 5. Update Environment Variables

Add to `.env`:

```env
# Application URLs
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

# Sanctum Configuration
SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost

# Session Configuration
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_DOMAIN=localhost
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax

# For production, use these settings:
# SESSION_DRIVER=database
# SESSION_SECURE_COOKIE=true
# SESSION_SAME_SITE=strict
```

**Important**: For cookie-based authentication, ensure your session driver is set to `database`, `redis`, or `memcached` (not `file`) for better reliability in API contexts.

Create the sessions table if using database driver:

```bash
php artisan make:session-table
php artisan migrate
```

### 6. API Routes

Create authentication routes in `routes/api.php`:

```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/*
|--------------------------------------------------------------------------
| Cookie-Based Authentication (SPA Mode)
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/login', function (Request $request) {
    $credentials = $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    if (!Auth::attempt($credentials, $request->boolean('remember'))) {
        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }

    $request->session()->regenerate();

    return response()->json([
        'user' => Auth::user(),
        'message' => 'Logged in successfully',
    ]);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/logout', function (Request $request) {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    });

    // Your protected routes here...
    Route::apiResource('products', ProductController::class);
});

/*
|--------------------------------------------------------------------------
| Token-Based Authentication (API Mode)
|--------------------------------------------------------------------------
*/

Route::post('/auth/login', function (Request $request) {
    $credentials = $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    if (!Auth::attempt($credentials)) {
        return response()->json([
            'message' => 'Invalid credentials',
            'errors' => [
                'email' => ['The provided credentials are incorrect.']
            ]
        ], 422);
    }

    $user = Auth::user();

    // Create token with abilities/scopes if needed
    $token = $user->createToken(
        $request->input('device_name', 'api-token'),
        ['*'], // Abilities
        now()->addDays(30) // Expiration
    )->plainTextToken;

    return response()->json([
        'token' => $token,
        'user' => $user,
    ]);
});

Route::middleware('auth:sanctum')->post('/auth/logout', function (Request $request) {
    // Revoke current token
    $request->user()->currentAccessToken()->delete();

    // Or revoke all tokens:
    // $request->user()->tokens()->delete();

    return response()->json([
        'message' => 'Logged out successfully'
    ]);
});
```

### 7. User Model Configuration

Ensure your `User` model uses the `HasApiTokens` trait (required for token-based auth):

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
```

### 8. Testing Your Setup

Test that CSRF cookies are working:

```bash
curl -X GET http://localhost:8000/sanctum/csrf-cookie \
  -H "Accept: application/json" \
  -H "Origin: http://localhost:3000" \
  -c cookies.txt -v
```

Test login:

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"email":"user@example.com","password":"password"}' \
  -b cookies.txt -c cookies.txt -v
```

---

## Usage

The module comes with two main composables `useAuth`, which takes care of the authentication and `useHttp` to handle http calls to your api gateway using the most common request methods: `get`, `post`, `put`, `patch` and `destroy` (since `delete` is a reserved keyword).

### Authentication (useAuth)

To authenticate the user against laravel sanctum, use the `login` method of the `useAuth` composable - here's an example of how this can be achieved in combination with [NuxtUiPro Form](https://ui.nuxt.com/components/form).

```vue

<template>
  <UForm :state="form" class="space-y-4" @submit="submit">
    <UFormField :error="errorFor('email')" label="Email" name="email">
      <UInput v-model="form.email" />
    </UFormField>

    <UFormField :error="errorFor('password')" label="Password" name="password">
      <UInput v-model="form.password" type="password" />
    </UFormField>

    <UButton type="submit">
      <span v-if="processing">Processing</span>
      <span v-else>Submit</span>
    </UButton>
  </UForm>
</template>
<script lang="ts" setup>
import { Reactive } from 'vue';

const {
  login,
  processing,
  errorBag: {
    message,
    get: errorFor,
  }
} = useAuth();

interface Login {
  email: string
  password: string
}

const form: Reactive<Login> = reactive({
  email: '',
  password: '',
})

const toast = useToast()

const submit = async () => {
  try {
    await login(form);
  } catch (error: Error) {
    toast.add({
      title: 'Error',
      description: message,
      color: 'error'
    })
  }
}
</script>
```

To log user out you can use `logout` method of the `useAuth` composable:

```vue
<template>
  <button type="button" @click="logMeOut">Logout</button>
</template>
<script lang="ts" setup>
const { logout } = useAuth()

const logMeOut = () => {
  logout();
}
</script>
```

You can also pass through a callback function to the `logout` method should you want to overwrite a default redirect behaviour:

```javascript
const logMeOut = () => {
  logout(() => {
    console.log('I have logged out!')
    navigateTo('/')
  });
}
```

You can check if user is authenticated by using `isLoggedIn` and to obtain an instance of the currently authenticated user use the `user` property:

```vue
<template>
  <p v-if="isLoggedIn">
    {{ user.name }}
    <span class="text-xs">{{ user.email }}</span>
  </p>
</template>
<script lang="ts" setup>
const { user, isLoggedIn } = useAuth()
</script>
```

### Http Client (useHttp)

You can use `useHttp` composable to perform requests to the api gateway using the most common request methods, represented by the corresponding method:

#### get / delete

Both `get` and `destroy` (`delete` is a reserved keyword so we had to come up with something close enough) share the same interface - here's an example how you can use `get` method:

```typescript
const { get, errorBag: { message } } = useHttp()

const getProducts = async () => {
    try {        
        const products = await get('/products')        
    } catch (error: Error) {
        toast.add({
            title: 'Error',
            description: message,
            color: 'error'
        })
    }
}
```

If you would like to append some query parameters to your url simply pass it as a second argument:

```typescript
const products = await get('/products', {
    page: 2
})
```

You can also pass any additional options as a third argument, which will be merged and passed through to the underlying `$Fetch` instance.
```typescript
const products = await get(
    '/products', 
    {
        page: 2
    }, 
    {
        retry: 3,
        retryDelay: 300
    }
)
```

#### post / put / patch

Again, all three share the same interface - an example below shows how you can use the `post` method to make a call:

```typescript
import type { Reactive } from 'vue';

const { post, errorBag: { message } } = useHttp()

interface Product {
    name: string,
    price?: number
}

const form: Reactive<Product> = reactive({
    name: '',
    price: null,
})

const createProduct = async () => {
    try {        
        await post('/products', form)        
    } catch (error: Error) {
        toast.add({
            title: 'Error',
            description: message,
            color: 'error'
        })
    }
}
```

The same as with the `get` method, you can pass any additional options to the call as a third argument:

```typescript
await post('/products', form, {
    retry: 3,
    retryDelay: 300
})
```

### Error bag

To simplify parsing of the errors, both `useAuth` and `useHttp` provide access to the underlying instance of the `useErrorBag` composable by the means of the `errorBag` property.

You can use this property to access the returned error `message` and, in case of the request that validates input `errors` property consisting of all validation errors.

The property also provides helper methods such as:

* `has`: to determine whether there is an error message available for a field
* `get`: to obtain the error message for a field

Here's a simple example of the above in action:

```vue
<template>
  <UForm :state="form" class="space-y-4" @submit="createProduct">
    <UFormField :error="errorFor('name')" label="Product name" name="name">
      <UInput
          v-model="form.name"
          :class="{ 'border-red-700': hasError('name') }"
      />
    </UFormField>

    <UFormField :error="errorFor('price')" label="Price" name="price">
      <UInput
          v-model="form.price"
          type="number"
          :class="{ 'border-red-700': hasError('price') }"
      />
    </UFormField>

    <UButton type="submit">
      Submit
    </UButton>
  </UForm>
</template>
<script lang="ts" setup>
import type { Reactive } from "vue";

const { 
  post, 
  errorBag: { 
    message, 
    get: errorFor, 
    has: hasError 
  } 
} = useHttp();

interface Product {
  name: string,
  price?: number
}

const form: Reactive<Product> = reactive({
  name: '',
  price: null,
})

const toast = useToast()

const createProduct = async () => {
  try {
    await post('/products', form)
  } catch (error: Error) {
    toast.add({
      title: 'Error',
      description: message,
      color: 'error'
    })
  }
}
</script>
```

### Processing status

Both `useAuth` and `useHttp` also come with the `processing` property, which indicates when the request is in progress by setting its value to boolean `true` or `false` - you can use it in a following way:

```vue
<template>
  <UForm :state="form" class="space-y-4" @submit="submit">
    //...
    <UButton type="submit">
      <span v-if="processing">Processing</span>
      <span v-else>Submit</span>
    </UButton>
  </UForm>
</template>
<script lang="ts" setup>

const {
  post,
  processing,
  errorBag: {
    message,
    //...
  }
} = useHttp();

const form = reactive({
  //...
})

const toast = useToast()

const submit = async () => {
  try {
    await post(form);
  } catch (error: Error) {
    toast.add({
      title: 'Error',
      description: message,
      color: 'error'
    })
  }
}
</script>
```

---

## Comprehensive Laravel Sanctum Examples

This section provides exhaustive examples for integrating your Nuxt 3 application with Laravel Sanctum.

### Cookie-Based Authentication (SPA Mode)

Cookie-based authentication is recommended for same-domain or subdomain setups. It's more secure and handles CSRF protection automatically.

#### Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@xsprtd/nuxt-api'],
  nuxtApi: {
    apiBaseURL: 'http://localhost:8000',
    originUrl: 'http://localhost:3000',
    authMode: 'cookie', // Cookie-based auth
    endpoints: {
      csrf: '/sanctum/csrf-cookie',
      login: '/api/login',
      logout: '/api/logout',
      user: '/api/user',
    },
    redirect: {
      intendedEnabled: true, // Remember requested page
      login: '/login',
      postLogin: '/dashboard',
      postLogout: '/login',
    },
  },
})
```

#### Complete Login Page Example

```vue
<script lang="ts" setup>
// pages/login.vue

definePageMeta({
  middleware: 'guest' // Only accessible when not logged in
})

interface LoginForm {
  email: string
  password: string
  remember?: boolean
}

const {
  login,
  processing,
  errorBag: { message, get: errorFor, has: hasError, reset }
} = useAuth()

const form = reactive<LoginForm>({
  email: '',
  password: '',
  remember: false
})

const toast = useToast()

const handleLogin = async () => {
  reset() // Clear previous errors

  try {
    await login(form)
    // Automatically redirects to dashboard or intended route
    toast.add({
      title: 'Success',
      description: 'Logged in successfully',
      color: 'green'
    })
  } catch (exception) {
    toast.add({
      title: 'Login Failed',
      description: message.value || 'Invalid credentials',
      color: 'red'
    })
  }
}
</script>

<template>
  <div class="max-w-md mx-auto mt-10">
    <h1 class="text-2xl font-bold mb-6">Login</h1>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label for="email" class="block mb-2">Email</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          :class="{ 'border-red-500': hasError('email') }"
          class="w-full px-4 py-2 border rounded"
          :disabled="processing"
          required
        />
        <span v-if="hasError('email')" class="text-red-500 text-sm">
          {{ errorFor('email') }}
        </span>
      </div>

      <div>
        <label for="password" class="block mb-2">Password</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          :class="{ 'border-red-500': hasError('password') }"
          class="w-full px-4 py-2 border rounded"
          :disabled="processing"
          required
        />
        <span v-if="hasError('password')" class="text-red-500 text-sm">
          {{ errorFor('password') }}
        </span>
      </div>

      <div class="flex items-center">
        <input
          id="remember"
          v-model="form.remember"
          type="checkbox"
          class="mr-2"
        />
        <label for="remember">Remember me</label>
      </div>

      <button
        type="submit"
        :disabled="processing"
        class="w-full px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {{ processing ? 'Logging in...' : 'Login' }}
      </button>
    </form>
  </div>
</template>
```

#### Protected Dashboard with User Profile

```vue
<script lang="ts" setup>
// pages/dashboard.vue

definePageMeta({
  middleware: 'auth' // Only accessible when logged in
})

interface User {
  id: number
  name: string
  email: string
  created_at: string
  email_verified_at?: string
}

const { user, isLoggedIn, logout, refreshUser } = useAuth<User>()

const handleLogout = async () => {
  try {
    await logout()
    // Automatically redirects to login page
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

// Refresh user data
const handleRefresh = async () => {
  try {
    await refreshUser()
  } catch (error) {
    console.error('Failed to refresh user:', error)
  }
}
</script>

<template>
  <div class="p-6">
    <div class="max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">Dashboard</h1>
        <button
          @click="handleLogout"
          class="px-4 py-2 bg-red-500 text-white rounded"
        >
          Logout
        </button>
      </div>

      <div v-if="isLoggedIn && user" class="bg-white shadow rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-4">Profile Information</h2>
        <div class="space-y-2">
          <p><strong>ID:</strong> {{ user.id }}</p>
          <p><strong>Name:</strong> {{ user.name }}</p>
          <p><strong>Email:</strong> {{ user.email }}</p>
          <p><strong>Member Since:</strong> {{ new Date(user.created_at).toLocaleDateString() }}</p>
          <p v-if="user.email_verified_at">
            <strong>Email Verified:</strong>
            {{ new Date(user.email_verified_at).toLocaleDateString() }}
          </p>
        </div>

        <button
          @click="handleRefresh"
          class="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Refresh Data
        </button>
      </div>
    </div>
  </div>
</template>
```

#### Custom Login Callback

```typescript
<script lang="ts" setup>
// pages/login-custom.vue

interface LoginResponse {
  user: User
  token?: string
  two_factor: boolean
}

const { login } = useAuth()

const handleLoginWithCallback = async () => {
  await login<LoginResponse>(
    { email: 'user@example.com', password: 'password' },
    {}, // Fetch options
    (responseData, user) => {
      // Custom callback overrides default redirect behavior

      if (responseData.two_factor) {
        // Redirect to 2FA page
        return navigateTo('/auth/two-factor')
      }

      // Store additional data
      if (responseData.token) {
        localStorage.setItem('additional_token', responseData.token)
      }

      // Custom redirect based on user role
      if (user?.role === 'admin') {
        return navigateTo('/admin')
      }

      return navigateTo('/dashboard')
    }
  )
}
</script>
```

### Token-Based Authentication (API Mode)

Token-based authentication is ideal for mobile apps, third-party integrations, or when your frontend and backend are on different domains.

#### Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@xsprtd/nuxt-api'],
  nuxtApi: {
    apiBaseURL: 'https://api.example.com',
    authMode: 'token', // Token-based auth
    token: {
      storageKey: 'AUTH_TOKEN',
      storageType: 'cookie', // or 'localStorage'
      responseKey: 'token', // Key in login response: { token: "..." }
    },
    endpoints: {
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      user: '/api/auth/user',
    },
  },
})
```

#### Laravel Backend for Token Mode

```php
// routes/api.php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

Route::post('/auth/login', function (Request $request) {
    $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    if (!Auth::attempt($request->only('email', 'password'))) {
        return response()->json([
            'message' => 'Invalid credentials',
            'errors' => [
                'email' => ['The provided credentials are incorrect.']
            ]
        ], 422);
    }

    $user = Auth::user();
    $token = $user->createToken('auth-token')->plainTextToken;

    return response()->json([
        'token' => $token,
        'user' => $user
    ]);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/auth/logout', function (Request $request) {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    });
});
```

#### Token Login Example

```vue
<script lang="ts" setup>
// pages/token-login.vue

interface TokenLoginResponse {
  token: string
  user: User
  expires_at?: string
}

const { login, processing, errorBag } = useAuth()

const form = reactive({
  email: '',
  password: ''
})

const handleTokenLogin = async () => {
  try {
    await login<TokenLoginResponse>(form)
    // Token is automatically stored and attached to future requests
  } catch (error) {
    console.error('Login failed:', error)
  }
}
</script>

<template>
  <form @submit.prevent="handleTokenLogin">
    <input v-model="form.email" type="email" placeholder="Email" />
    <input v-model="form.password" type="password" placeholder="Password" />
    <button type="submit" :disabled="processing">Login</button>
  </form>
</template>
```

#### Nested Token Response

If your API returns token in a nested structure:

```typescript
// nuxt.config.ts - for response like { data: { auth_token: "..." } }
export default defineNuxtConfig({
  nuxtApi: {
    authMode: 'token',
    token: {
      responseKey: 'data.auth_token', // Supports dot notation
      // ...
    },
  },
})
```

### Complete CRUD Operations

#### Resource List with Pagination

```vue
<script lang="ts" setup>
// pages/products/index.vue

definePageMeta({
  middleware: 'auth'
})

interface Product {
  id: number
  name: string
  price: number
  description: string
  stock: number
}

interface PaginatedResponse {
  data: Product[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

const { get, processing, errorBag } = useHttp()

const products = ref<Product[]>([])
const pagination = ref({
  currentPage: 1,
  lastPage: 1,
  total: 0
})

const loadProducts = async (page: number = 1) => {
  try {
    const response = await get<PaginatedResponse>('/api/products', {
      page,
      per_page: 15,
      sort: 'name',
      order: 'asc',
      search: '' // Optional search term
    })

    products.value = response.data
    pagination.value = {
      currentPage: response.current_page,
      lastPage: response.last_page,
      total: response.total
    }
  } catch (error) {
    console.error('Failed to load products:', errorBag.message.value)
  }
}

const deleteProduct = async (id: number) => {
  if (!confirm('Are you sure?')) return

  try {
    await useHttp().destroy(`/api/products/${id}`)
    await loadProducts(pagination.value.currentPage)
  } catch (error) {
    console.error('Failed to delete product')
  }
}

onMounted(() => loadProducts())
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Products</h1>
      <NuxtLink to="/products/create" class="btn-primary">
        Add Product
      </NuxtLink>
    </div>

    <div v-if="processing" class="text-center py-8">
      Loading...
    </div>

    <div v-else-if="products.length">
      <table class="w-full">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td>{{ product.id }}</td>
            <td>{{ product.name }}</td>
            <td>${{ product.price.toFixed(2) }}</td>
            <td>{{ product.stock }}</td>
            <td class="space-x-2">
              <NuxtLink :to="`/products/${product.id}`">View</NuxtLink>
              <NuxtLink :to="`/products/${product.id}/edit`">Edit</NuxtLink>
              <button @click="deleteProduct(product.id)" class="text-red-500">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="flex justify-center space-x-2 mt-6">
        <button
          v-for="page in pagination.lastPage"
          :key="page"
          @click="loadProducts(page)"
          :class="{ 'bg-blue-500 text-white': page === pagination.currentPage }"
          class="px-3 py-1 border rounded"
        >
          {{ page }}
        </button>
      </div>
    </div>

    <div v-else class="text-center py-8 text-gray-500">
      No products found
    </div>
  </div>
</template>
```

#### Create Resource

```vue
<script lang="ts" setup>
// pages/products/create.vue

definePageMeta({
  middleware: 'auth'
})

interface ProductForm {
  name: string
  price: number | null
  description: string
  stock: number | null
  category_id: number | null
}

const { post, processing, errorBag } = useHttp()
const router = useRouter()
const toast = useToast()

const form = reactive<ProductForm>({
  name: '',
  price: null,
  description: '',
  stock: null,
  category_id: null
})

const createProduct = async () => {
  errorBag.reset()

  try {
    const product = await post<{ data: Product }>('/api/products', form)

    toast.add({
      title: 'Success',
      description: 'Product created successfully',
      color: 'green'
    })

    router.push(`/products/${product.data.id}`)
  } catch (error) {
    toast.add({
      title: 'Validation Error',
      description: errorBag.message.value,
      color: 'red'
    })
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">Create Product</h1>

    <form @submit.prevent="createProduct" class="space-y-4">
      <div>
        <label for="name" class="block mb-2">Product Name</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          :class="{ 'border-red-500': errorBag.has('name') }"
          class="w-full px-4 py-2 border rounded"
          required
        />
        <span v-if="errorBag.has('name')" class="text-red-500 text-sm">
          {{ errorBag.get('name') }}
        </span>
      </div>

      <div>
        <label for="price" class="block mb-2">Price</label>
        <input
          id="price"
          v-model.number="form.price"
          type="number"
          step="0.01"
          :class="{ 'border-red-500': errorBag.has('price') }"
          class="w-full px-4 py-2 border rounded"
          required
        />
        <span v-if="errorBag.has('price')" class="text-red-500 text-sm">
          {{ errorBag.get('price') }}
        </span>
      </div>

      <div>
        <label for="description" class="block mb-2">Description</label>
        <textarea
          id="description"
          v-model="form.description"
          :class="{ 'border-red-500': errorBag.has('description') }"
          class="w-full px-4 py-2 border rounded"
          rows="4"
        />
        <span v-if="errorBag.has('description')" class="text-red-500 text-sm">
          {{ errorBag.get('description') }}
        </span>
      </div>

      <div>
        <label for="stock" class="block mb-2">Stock</label>
        <input
          id="stock"
          v-model.number="form.stock"
          type="number"
          :class="{ 'border-red-500': errorBag.has('stock') }"
          class="w-full px-4 py-2 border rounded"
          required
        />
        <span v-if="errorBag.has('stock')" class="text-red-500 text-sm">
          {{ errorBag.get('stock') }}
        </span>
      </div>

      <div class="flex space-x-4">
        <button
          type="submit"
          :disabled="processing"
          class="px-6 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {{ processing ? 'Creating...' : 'Create Product' }}
        </button>

        <NuxtLink to="/products" class="px-6 py-2 border rounded">
          Cancel
        </NuxtLink>
      </div>
    </form>
  </div>
</template>
```

#### Update Resource

```vue
<script lang="ts" setup>
// pages/products/[id]/edit.vue

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const { get, put, processing, errorBag } = useHttp()
const toast = useToast()

const productId = computed(() => route.params.id as string)

interface ProductForm {
  name: string
  price: number
  description: string
  stock: number
}

const form = reactive<ProductForm>({
  name: '',
  price: 0,
  description: '',
  stock: 0
})

const loading = ref(true)

// Load existing product
const loadProduct = async () => {
  try {
    const response = await get<{ data: Product }>(`/api/products/${productId.value}`)
    Object.assign(form, response.data)
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to load product',
      color: 'red'
    })
    router.push('/products')
  } finally {
    loading.value = false
  }
}

const updateProduct = async () => {
  errorBag.reset()

  try {
    await put(`/api/products/${productId.value}`, form)

    toast.add({
      title: 'Success',
      description: 'Product updated successfully',
      color: 'green'
    })

    router.push(`/products/${productId.value}`)
  } catch (error) {
    toast.add({
      title: 'Error',
      description: errorBag.message.value,
      color: 'red'
    })
  }
}

onMounted(loadProduct)
</script>

<template>
  <div class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">Edit Product</h1>

    <div v-if="loading" class="text-center py-8">Loading...</div>

    <form v-else @submit.prevent="updateProduct" class="space-y-4">
      <!-- Same form fields as create -->
      <div>
        <label for="name" class="block mb-2">Product Name</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          :class="{ 'border-red-500': errorBag.has('name') }"
          class="w-full px-4 py-2 border rounded"
        />
        <span v-if="errorBag.has('name')" class="text-red-500 text-sm">
          {{ errorBag.get('name') }}
        </span>
      </div>

      <!-- Other fields... -->

      <div class="flex space-x-4">
        <button
          type="submit"
          :disabled="processing"
          class="px-6 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {{ processing ? 'Updating...' : 'Update Product' }}
        </button>

        <NuxtLink :to="`/products/${productId}`" class="px-6 py-2 border rounded">
          Cancel
        </NuxtLink>
      </div>
    </form>
  </div>
</template>
```

#### View Single Resource

```vue
<script lang="ts" setup>
// pages/products/[id]/index.vue

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const { get, destroy } = useHttp()
const router = useRouter()

const productId = computed(() => route.params.id as string)
const product = ref<Product | null>(null)
const loading = ref(true)

const loadProduct = async () => {
  try {
    const response = await get<{ data: Product }>(`/api/products/${productId.value}`)
    product.value = response.data
  } catch (error) {
    router.push('/products')
  } finally {
    loading.value = false
  }
}

const deleteProduct = async () => {
  if (!confirm('Are you sure you want to delete this product?')) return

  try {
    await destroy(`/api/products/${productId.value}`)
    router.push('/products')
  } catch (error) {
    console.error('Failed to delete product')
  }
}

onMounted(loadProduct)
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <div v-if="loading" class="text-center py-8">Loading...</div>

    <div v-else-if="product">
      <div class="flex justify-between items-start mb-6">
        <h1 class="text-3xl font-bold">{{ product.name }}</h1>
        <div class="space-x-2">
          <NuxtLink
            :to="`/products/${productId}/edit`"
            class="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Edit
          </NuxtLink>
          <button
            @click="deleteProduct"
            class="px-4 py-2 bg-red-500 text-white rounded"
          >
            Delete
          </button>
        </div>
      </div>

      <div class="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <h2 class="text-lg font-semibold text-gray-700">Price</h2>
          <p class="text-2xl font-bold">${{ product.price.toFixed(2) }}</p>
        </div>

        <div>
          <h2 class="text-lg font-semibold text-gray-700">Stock</h2>
          <p>{{ product.stock }} units available</p>
        </div>

        <div>
          <h2 class="text-lg font-semibold text-gray-700">Description</h2>
          <p class="text-gray-600">{{ product.description }}</p>
        </div>
      </div>

      <NuxtLink to="/products" class="inline-block mt-6 text-blue-500">
        ← Back to Products
      </NuxtLink>
    </div>
  </div>
</template>
```

### Advanced Use Cases

#### File Upload

```vue
<script lang="ts" setup>
// pages/profile/avatar.vue

const { post, processing, errorBag } = useHttp()
const { user } = useAuth()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
  }
}

const uploadAvatar = async () => {
  if (!selectedFile.value) return

  const formData = new FormData()
  formData.append('avatar', selectedFile.value)
  formData.append('user_id', user.value.id.toString())

  try {
    const response = await post('/api/profile/avatar', formData as any, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    console.log('Avatar uploaded:', response)
  } catch (error) {
    console.error('Upload failed:', errorBag.message.value)
  }
}
</script>

<template>
  <div class="p-6">
    <h2 class="text-xl font-bold mb-4">Upload Avatar</h2>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      @change="handleFileSelect"
      class="mb-4"
    />

    <button
      @click="uploadAvatar"
      :disabled="!selectedFile || processing"
      class="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
    >
      {{ processing ? 'Uploading...' : 'Upload' }}
    </button>

    <p v-if="errorBag.has('avatar')" class="text-red-500 mt-2">
      {{ errorBag.get('avatar') }}
    </p>
  </div>
</template>
```

#### Laravel Backend for File Upload

```php
// routes/api.php

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/profile/avatar', function (Request $request) {
        $request->validate([
            'avatar' => 'required|image|max:2048', // 2MB max
        ]);

        $path = $request->file('avatar')->store('avatars', 'public');

        $request->user()->update([
            'avatar_path' => $path
        ]);

        return response()->json([
            'message' => 'Avatar uploaded successfully',
            'path' => $path,
            'url' => Storage::url($path)
        ]);
    });
});
```

#### Custom Headers

```typescript
// nuxt.config.ts - Global headers for all requests
export default defineNuxtConfig({
  nuxtApi: {
    apiBaseURL: 'https://api.example.com',
    headers: {
      'X-Custom-Header': 'value',
      'X-API-Version': 'v1',
      'Accept-Language': 'en-US',
    },
  },
})
```

```vue
<script lang="ts" setup>
// Per-request custom headers

const { get } = useHttp()

const fetchWithCustomHeaders = async () => {
  const data = await get('/api/data', {}, {
    headers: {
      'X-Request-ID': crypto.randomUUID(),
      'X-Client-Version': '1.0.0',
    }
  })
}
</script>
```

#### Retry Failed Requests

```typescript
// nuxt.config.ts - Global retry configuration
export default defineNuxtConfig({
  nuxtApi: {
    fetchOptions: {
      retryAttempts: 3, // Retry failed requests 3 times
    },
  },
})
```

```vue
<script lang="ts" setup>
// Per-request retry configuration

const { get } = useHttp()

const fetchWithRetry = async () => {
  try {
    const data = await get('/api/unreliable-endpoint', {}, {
      retry: 5, // Override global config
      retryDelay: 1000, // Wait 1 second between retries
      retryStatusCodes: [408, 500, 502, 503, 504],
    })
  } catch (error) {
    console.error('Failed after retries:', error)
  }
}
</script>
```

#### Composable for Shared Logic

```typescript
// composables/useProducts.ts

export const useProducts = () => {
  const { get, post, put, destroy, processing, errorBag } = useHttp()

  const products = ref<Product[]>([])
  const currentProduct = ref<Product | null>(null)

  const fetchProducts = async (filters?: Record<string, any>) => {
    try {
      const response = await get<{ data: Product[] }>('/api/products', filters)
      products.value = response.data
      return response
    } catch (error) {
      console.error('Failed to fetch products:', errorBag.message.value)
      throw error
    }
  }

  const fetchProduct = async (id: number | string) => {
    try {
      const response = await get<{ data: Product }>(`/api/products/${id}`)
      currentProduct.value = response.data
      return response.data
    } catch (error) {
      console.error('Failed to fetch product:', errorBag.message.value)
      throw error
    }
  }

  const createProduct = async (data: Partial<Product>) => {
    try {
      const response = await post<{ data: Product }>('/api/products', data)
      products.value.push(response.data)
      return response.data
    } catch (error) {
      throw error
    }
  }

  const updateProduct = async (id: number | string, data: Partial<Product>) => {
    try {
      const response = await put<{ data: Product }>(`/api/products/${id}`, data)
      const index = products.value.findIndex(p => p.id === id)
      if (index !== -1) {
        products.value[index] = response.data
      }
      return response.data
    } catch (error) {
      throw error
    }
  }

  const deleteProduct = async (id: number | string) => {
    try {
      await destroy(`/api/products/${id}`)
      products.value = products.value.filter(p => p.id !== id)
    } catch (error) {
      throw error
    }
  }

  return {
    products,
    currentProduct,
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    processing,
    errorBag,
  }
}
```

```vue
<script lang="ts" setup>
// Usage in component

const {
  products,
  fetchProducts,
  deleteProduct,
  processing,
  errorBag
} = useProducts()

onMounted(() => fetchProducts({ status: 'active' }))
</script>
```

#### App-wide Authentication Layout

```vue
<script lang="ts" setup>
// layouts/auth.vue

const { user, isLoggedIn } = useAuth()

// Redirect if not authenticated
watchEffect(() => {
  if (!isLoggedIn.value) {
    navigateTo('/login')
  }
})
</script>

<template>
  <div v-if="isLoggedIn" class="min-h-screen flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-gray-800 text-white p-6">
      <div class="mb-8">
        <h2 class="text-xl font-bold">{{ user?.name }}</h2>
        <p class="text-sm text-gray-400">{{ user?.email }}</p>
      </div>

      <nav class="space-y-2">
        <NuxtLink to="/dashboard" class="block py-2 px-4 rounded hover:bg-gray-700">
          Dashboard
        </NuxtLink>
        <NuxtLink to="/products" class="block py-2 px-4 rounded hover:bg-gray-700">
          Products
        </NuxtLink>
        <NuxtLink to="/orders" class="block py-2 px-4 rounded hover:bg-gray-700">
          Orders
        </NuxtLink>
        <NuxtLink to="/profile" class="block py-2 px-4 rounded hover:bg-gray-700">
          Profile
        </NuxtLink>
      </nav>
    </aside>

    <!-- Main content -->
    <main class="flex-1 bg-gray-100">
      <slot />
    </main>
  </div>
</template>
```

```vue
<script lang="ts" setup>
// pages/dashboard.vue

definePageMeta({
  layout: 'auth' // Use the auth layout
})
</script>

<template>
  <div class="p-6">
    <h1>Dashboard Content</h1>
  </div>
</template>
```

#### Nested User Data

If your API returns user data in a nested structure:

```typescript
// nuxt.config.ts - for response like { data: { user: { ... } } }
export default defineNuxtConfig({
  nuxtApi: {
    userResponseKey: 'data.user', // Supports dot notation
    // ...
  },
})
```

Laravel backend example:

```php
// routes/api.php

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return response()->json([
        'data' => [
            'user' => $request->user(),
            'permissions' => $request->user()->permissions,
            'roles' => $request->user()->roles
        ]
    ]);
});
```

#### Error Handling Patterns

```vue
<script lang="ts" setup>
// Comprehensive error handling

const { post, errorBag } = useHttp()

const handleFormSubmit = async (formData: any) => {
  try {
    errorBag.reset() // Clear previous errors

    const response = await post('/api/resource', formData)

    // Success handling
    console.log('Success:', response)

  } catch (error: any) {
    // Error is automatically handled by errorBag

    // Check error status
    if (error.statusCode === 422) {
      // Validation errors
      console.log('Validation errors:', errorBag.errors.value)

      // Check specific field
      if (errorBag.has('email')) {
        console.log('Email error:', errorBag.get('email'))
      }
    } else if (error.statusCode === 419) {
      // CSRF token mismatch
      console.log('CSRF error:', errorBag.message.value)
    } else if (error.statusCode === 401) {
      // Unauthorized - user state automatically cleared
      console.log('Unauthorized:', errorBag.message.value)
    } else {
      // General error
      console.log('Error:', errorBag.message.value)
    }
  }
}

// Get error with default value
const getErrorOrDefault = () => {
  return errorBag.get('field_name', 'No error') // Returns 'No error' if no error exists
}
</script>
```

#### TypeScript Type Safety

```typescript
// types/api.ts

export interface User {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  created_at: string
  updated_at: string
  role: 'admin' | 'user'
  avatar_url?: string
}

export interface Product {
  id: number
  name: string
  slug: string
  description: string
  price: number
  stock: number
  category_id: number
  category?: Category
  images: ProductImage[]
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
}

export interface ProductImage {
  id: number
  product_id: number
  url: string
  is_primary: boolean
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}
```

```vue
<script lang="ts" setup>
// Using types in components

import type { User, Product, ApiResponse, PaginatedResponse } from '~/types/api'

const { user } = useAuth<User>()
const { get, post } = useHttp()

// Typed GET request
const fetchProducts = async () => {
  const response = await get<PaginatedResponse<Product>>('/api/products', {
    page: 1,
    per_page: 20
  })

  // response is fully typed
  console.log(response.data[0].name) // TypeScript knows this is a Product[]
}

// Typed POST request
const createProduct = async (productData: Partial<Product>) => {
  const response = await post<ApiResponse<Product>>('/api/products', productData)

  // response.data is typed as Product
  console.log(response.data.id)
}

// User is fully typed
watchEffect(() => {
  if (user.value) {
    console.log(user.value.name) // TypeScript knows User properties

    if (user.value.role === 'admin') {
      // Admin-specific logic
    }
  }
})
</script>
```

#### Testing Authentication

```typescript
// tests/auth.test.ts (example with Vitest)

import { describe, it, expect, beforeEach } from 'vitest'
import { useAuth } from '@xsprtd/nuxt-api'

describe('Authentication', () => {
  beforeEach(() => {
    // Setup test environment
  })

  it('should login successfully', async () => {
    const { login, isLoggedIn, user } = useAuth()

    await login({
      email: 'test@example.com',
      password: 'password'
    })

    expect(isLoggedIn.value).toBe(true)
    expect(user.value).toBeDefined()
    expect(user.value?.email).toBe('test@example.com')
  })

  it('should handle login errors', async () => {
    const { login, errorBag } = useAuth()

    try {
      await login({
        email: 'invalid@example.com',
        password: 'wrong'
      })
    } catch (error) {
      expect(errorBag.has('email')).toBe(true)
    }
  })

  it('should logout successfully', async () => {
    const { logout, isLoggedIn, user } = useAuth()

    await logout()

    expect(isLoggedIn.value).toBe(false)
    expect(user.value).toBeNull()
  })
})
```

---

## API Reference

### useAuth Composable

#### Properties

- `user: Ref<T | null>` - The authenticated user object
- `isLoggedIn: ComputedRef<boolean>` - Whether user is authenticated
- `processing: Ref<boolean>` - Whether an auth request is in progress
- `errorBag: ErrorBagInterface` - Error handling object

#### Methods

##### login()

```typescript
login<LoginApiResponse>(
  credentials: Record<string, string>,
  clientOptions?: FetchOptions,
  callback?: (responseData: LoginApiResponse, user: T | null) => unknown
): Promise<unknown>
```

##### logout()

```typescript
logout(callback?: () => unknown): Promise<unknown>
```

##### refreshUser()

```typescript
refreshUser(): Promise<void>
```

### useHttp Composable

#### Properties

- `processing: Ref<boolean>` - Whether a request is in progress
- `errorBag: ErrorBagInterface` - Error handling object

#### Methods

```typescript
get<T, R extends ResponseType = 'json'>(
  request: string,
  query?: Record<string, unknown>,
  options?: FetchOptions<R>
): Promise<MappedResponseType<R, T>>

post<T, R extends ResponseType = 'json'>(
  request: string,
  body?: Record<string, string>,
  options?: FetchOptions<R>
): Promise<MappedResponseType<R, T>>

put<T, R extends ResponseType = 'json'>(
  request: string,
  body?: Record<string, string>,
  options?: FetchOptions<R>
): Promise<MappedResponseType<R, T>>

patch<T, R extends ResponseType = 'json'>(
  request: string,
  body?: Record<string, string>,
  options?: FetchOptions<R>
): Promise<MappedResponseType<R, T>>

destroy<T, R extends ResponseType = 'json'>(
  request: string,
  query?: Record<string, unknown>,
  options?: FetchOptions<R>
): Promise<MappedResponseType<R, T>>
```

### ErrorBag Interface

```typescript
interface ErrorBagInterface {
  message: Ref<string | null>
  errors: Ref<{ [key: string]: string[] } | null>

  has(key: string): boolean
  get<T = false>(key: string, defaultValue?: T): string | T
  handle(error?: Error): void
  reset(): void
}
```

### Middleware

By default, the module does **not** register any middleware to avoid conflicts with your application's own middleware. You can opt-in to the built-in middleware by configuring `middlewareNames`:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nuxtApi: {
    middlewareNames: {
      auth: 'auth',   // Register auth middleware
      guest: 'guest', // Register guest middleware
    }
  }
})
```

Once enabled:
- `auth` - Protects routes, requires authentication. Redirects unauthenticated users to the login page.
- `guest` - Restricts authenticated users. Redirects authenticated users to the post-login page.

```vue
<script lang="ts" setup>
definePageMeta({
  middleware: 'auth' // or 'guest'
})
</script>
```

#### Custom Middleware with useAuthMiddleware

If you need custom middleware logic while still leveraging the package's authentication state, use the `useAuthMiddleware` composable:

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const { checkAuth } = useAuthMiddleware()
  const result = checkAuth(to)

  if (!result.isAuthenticated) {
    if (result.redirectTo) {
      return navigateTo(result.redirectTo, { replace: true })
    }
    // Custom handling when no redirect is configured
    throw createError({ statusCode: 403, message: 'Access denied' })
  }

  // Add your custom logic here (e.g., role checks, permissions)
})
```

```typescript
// middleware/guest.ts
export default defineNuxtRouteMiddleware((to) => {
  const { checkGuest } = useAuthMiddleware()
  const result = checkGuest(to)

  if (result.isAuthenticated && result.redirectTo) {
    return navigateTo(result.redirectTo, { replace: true })
  }

  // Add your custom logic here
})
```

#### Combined Auth Middleware Example

A single middleware that handles both authenticated and guest routes:

```typescript
// middleware/auth-guard.ts
export default defineNuxtRouteMiddleware((to) => {
  const { isLoggedIn, checkAuth, checkGuest } = useAuthMiddleware()
  const isGuestRoute = to.meta.guest === true

  if (isGuestRoute) {
    // Guest-only route (e.g., login page)
    const result = checkGuest(to)
    if (result.isAuthenticated && result.redirectTo) {
      return navigateTo(result.redirectTo, { replace: true })
    }
  } else if (to.meta.auth !== false) {
    // Protected route (default behavior)
    const result = checkAuth(to)
    if (!result.isAuthenticated && result.redirectTo) {
      return navigateTo(result.redirectTo, { replace: true })
    }
  }
})
```

### useAuthMiddleware Composable

The `useAuthMiddleware` composable provides helper functions for building custom middleware.

#### Properties

- `isLoggedIn: ComputedRef<boolean>` - Whether user is authenticated (from `useAuth`)

#### Methods

##### checkAuth()

Checks if user should be allowed to access authenticated routes.

```typescript
checkAuth(to: RouteLocationNormalized): AuthCheckResult
```

Returns:
```typescript
interface AuthCheckResult {
  isAuthenticated: boolean
  redirectTo: RouteLocationRaw | null  // null if no redirect configured
}
```

##### checkGuest()

Checks if authenticated user should be redirected away from guest-only routes.

```typescript
checkGuest(to: RouteLocationNormalized): AuthCheckResult
```

Returns the same `AuthCheckResult` interface.

---

## Troubleshooting

### CORS Issues

If you're experiencing CORS errors:

1. Ensure `config/cors.php` includes your frontend URL
2. Set `supports_credentials` to `true`
3. Check `SANCTUM_STATEFUL_DOMAINS` includes your frontend domain
4. Verify `originUrl` in Nuxt config matches your frontend URL

### CSRF Token Mismatch

If you get CSRF token errors:

1. Ensure cookies are being sent with requests
2. Check `SESSION_DOMAIN` in Laravel `.env`
3. Verify `SESSION_SECURE_COOKIE` is `false` for local development
4. Clear browser cookies and try again

### 401 Unauthorized

If authenticated requests return 401:

1. Check token is stored correctly (token mode)
2. Verify Sanctum middleware is applied to routes
3. Ensure `EnsureFrontendRequestsAreStateful` is in API middleware
4. Check session configuration in Laravel

### Token Not Persisting

If token disappears after refresh:

1. Verify `storageType` is set correctly
2. Check browser's cookie/localStorage settings
3. Ensure token key matches across requests
4. Verify token is returned from login endpoint

### User Not Loading

If user data isn't loading:

1. Check `userResponseKey` configuration
2. Verify `/api/user` endpoint returns correct data
3. Check network tab for failed requests
4. Ensure `auth:sanctum` middleware is applied

---

## Building & Publishing

This section is for contributors and maintainers who want to build, test, or publish this module.

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/xsprtd/nuxt-api.git
   cd nuxt-api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Prepare development environment**:
   ```bash
   npm run dev:prepare
   ```

   This command:
   - Builds the module in stub mode
   - Prepares the module builder
   - Prepares the playground for testing

4. **Start development server**:
   ```bash
   npm run dev
   ```

### Building for Production

To build the module for production:

```bash
npm run prepack
```

This compiles the TypeScript source and generates:
- `dist/module.mjs` - ESM (ECMAScript Module) format
- `dist/module.cjs` - CommonJS format
- `dist/types.d.ts` - TypeScript type definitions
- `dist/runtime/` - Runtime files

### Testing

The module includes a comprehensive test suite with **202 tests** covering all core functionality.

**Coverage Summary:**
- **95.29%** statement coverage
- **92.81%** branch coverage
- **97.82%** function coverage

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npx vitest run --coverage

# Type checking
npm run test:types

# Lint code
npm run lint
```

**Test Structure:**
```
test/
├── mocks/           # Nuxt composable mocks
├── utils/           # Test utilities and helpers
├── unit/            # Unit tests for composables, services, middleware
│   ├── composables/
│   ├── helpers/
│   ├── middleware/
│   └── services/
└── integration/     # Integration tests for full auth flows
```

### Local Testing

To test the module in another project before publishing:

1. **Link the module locally**:
   ```bash
   # In the nuxt-api directory
   npm link
   ```

2. **Use the linked module in your project**:
   ```bash
   # In your Nuxt project
   npm link @xsprtd/nuxt-api
   ```

3. **Test your changes**

4. **Unlink when done**:
   ```bash
   # In your Nuxt project
   npm unlink @xsprtd/nuxt-api

   # In the nuxt-api directory
   npm unlink
   ```

### Publishing to npm

#### Automated Release (Recommended)

The automated release workflow handles versioning, changelog, building, and publishing:

```bash
npm run release
```

This command:
1. Runs linting
2. Builds the module
3. Generates changelog using `changelogen`
4. Publishes to npm
5. Pushes git tags

#### Manual Release

If you prefer manual control over the release process:

1. **Run quality checks**:
   ```bash
   npm run lint
   npm run test
   npm run test:types
   ```

2. **Build the module**:
   ```bash
   npm run prepack
   ```

3. **Update version** (choose one):
   ```bash
   npm version patch  # 1.0.0 -> 1.0.1 (bug fixes)
   npm version minor  # 1.0.0 -> 1.1.0 (new features)
   npm version major  # 1.0.0 -> 2.0.0 (breaking changes)
   ```

4. **Publish to npm**:
   ```bash
   npm publish
   ```

5. **Push changes and tags**:
   ```bash
   git push --follow-tags
   ```

### Version Management

This project follows [Semantic Versioning](https://semver.org/):

- **PATCH** (1.0.x): Bug fixes and minor updates
- **MINOR** (1.x.0): New features, backward compatible
- **MAJOR** (x.0.0): Breaking changes

### Build Output

After building, the `dist/` directory contains:

```
dist/
├── module.mjs           # ESM entry point
├── module.cjs           # CommonJS entry point
├── types.d.ts           # TypeScript definitions
└── runtime/             # Runtime composables and utilities
    ├── composables/
    ├── middleware/
    ├── services/
    └── types/
```

### Pre-publish Checklist

Before publishing a new version:

- [ ] All tests pass (`npm run test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Type checking passes (`npm run test:types`)
- [ ] Updated README if needed
- [ ] Updated CHANGELOG (or use automated release)
- [ ] Version bumped appropriately
- [ ] Tested locally with `npm link`
- [ ] Build succeeds (`npm run prepack`)

### CI/CD

If using GitHub Actions or similar, you can automate releases:

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches:
      - main

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: |
          npm run lint
          npm run test
          npm run test:types

      - name: Build
        run: npm run prepack

      - name: Semantic Release
        run: npm run semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Available Scripts

```bash
# Development
npm run dev              # Start playground dev server
npm run dev:build        # Build playground
npm run dev:prepare      # Prepare development environment

# Building
npm run prepack          # Build module for production
npm run prepare          # Prepare module (runs automatically)

# Testing
npm run lint             # Lint code with ESLint
npm run test             # Run tests with Vitest
npm run test:watch       # Run tests in watch mode
npm run test:types       # Type check with vue-tsc

# Publishing
npm run release          # Full release workflow
npm run semantic-release # Semantic versioning release
npm run link             # Link module locally
```

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This module is licensed under the [MIT license](https://opensource.org/license/MIT).